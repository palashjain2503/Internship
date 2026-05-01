import os
import sqlite3
import uuid
from datetime import datetime
from collections import Counter

from flask import Blueprint, jsonify, request
from flask_socketio import emit, join_room

live_bp = Blueprint("live_realtime", __name__, url_prefix="/api/live")

ACTIVE_SESSIONS = {}

DB_PATH = "livecase.db"


def now_iso():
    return datetime.utcnow().isoformat() + "Z"


def build_join_url(session_id, frontend_base_url=None):
    base = frontend_base_url or os.environ.get("FRONTEND_BASE_URL") or "http://localhost:5174"
    return f"{base.rstrip('/')}/LiveCase.ai.html?session_id={session_id}"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_live_tables():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        teacher_name TEXT,
        status TEXT,
        created_at TEXT,
        ended_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        kind TEXT,
        prompt TEXT,
        options_json TEXT,
        multi_select INTEGER DEFAULT 0,
        timer_sec INTEGER,
        status TEXT,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        question_id TEXT,
        student_id TEXT,
        student_name TEXT,
        answer_json TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()


def create_session_memory(session_id, title, teacher_name):
    ACTIVE_SESSIONS[session_id] = {
        "session_id": session_id,
        "title": title,
        "teacher_name": teacher_name,
        "status": "CREATED",
        "created_at": now_iso(),
        "participants": {},
        "participant_count": 0,
        "current_question": None,
        "questions": {},
        "responses": {}
    }


def serialize_session(session):
    return {
        "session_id": session["session_id"],
        "title": session["title"],
        "teacher_name": session["teacher_name"],
        "status": session["status"],
        "created_at": session["created_at"],
        "participant_count": session["participant_count"],
        "participants": list(session["participants"].values()),
        "current_question": session["current_question"],
        "questions": list(session["questions"].values())
    }


def aggregate_results(question, response_map):
    kind = question["kind"]
    if kind in ("mcq", "multi_select", "poll"):
        counts = Counter()
        for item in response_map.values():
            for choice in item.get("answer", []):
                counts[choice] += 1
        return {
            "question_id": question["question_id"],
            "kind": kind,
            "response_count": len(response_map),
            "distribution": dict(counts)
        }

    return {
        "question_id": question["question_id"],
        "kind": kind,
        "response_count": len(response_map),
        "responses": [
            {
                "student_id": v["student_id"],
                "student_name": v["student_name"],
                "answer": v["answer"]
            }
            for v in response_map.values()
        ]
    }


@live_bp.post("/sessions")
def create_live_session():
    payload = request.get_json(force=True) or {}
    title = payload.get("title", "Untitled Live Session")
    teacher_name = payload.get("teacher_name", "Teacher")
    session_id = f"sess_{uuid.uuid4().hex[:8]}"

    create_session_memory(session_id, title, teacher_name)

    conn = get_db()
    conn.execute(
        "INSERT INTO sessions (id, title, teacher_name, status, created_at, ended_at) VALUES (?, ?, ?, ?, ?, ?)",
        (session_id, title, teacher_name, "CREATED", now_iso(), None)
    )
    conn.commit()
    conn.close()

    frontend_base_url = payload.get("frontend_base_url")
    join_url = build_join_url(session_id, frontend_base_url)

    return jsonify({
        "session_id": session_id,
        "join_url": join_url,
        "qr_value": join_url,
        "status": "CREATED"
    })


@live_bp.get("/sessions/<session_id>")
def get_live_session(session_id):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        return jsonify({"error": "session_not_found"}), 404
    return jsonify({"session": serialize_session(session)})


def register_socket_handlers(socketio):
    @socketio.on("join_session")
    def handle_join_session(data):
        session_id = data.get("session_id")
        user_id = data.get("user_id")
        name = data.get("name", "Guest")
        role = data.get("role", "student")

        if not session_id or not user_id:
            emit("error", {"message": "session_id and user_id required"})
            return

        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        join_room(session_id)

        session["participants"][user_id] = {
            "user_id": user_id,
            "name": name,
            "role": role,
            "joined_at": now_iso()
        }
        session["participant_count"] = len(session["participants"])

        emit("session_snapshot", {
            "session": serialize_session(session),
            "current_question": session["current_question"]
        })

        socketio.emit("user_joined", {
            "session_id": session_id,
            "user": session["participants"][user_id],
            "participant_count": session["participant_count"]
        }, room=session_id)

    @socketio.on("teacher_new_question")
    def handle_teacher_new_question(data):
        session_id = data.get("session_id")
        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        question_id = data.get("question_id") or f"q_{uuid.uuid4().hex[:8]}"
        kind = data.get("kind", "mcq")
        prompt = data.get("prompt", "")
        options = data.get("options", [])
        multi_select = bool(data.get("multi_select", False))
        timer_sec = data.get("timer_sec")

        question = {
            "question_id": question_id,
            "kind": kind,
            "prompt": prompt,
            "options": options,
            "multi_select": multi_select,
            "timer_sec": timer_sec,
            "status": "LIVE",
            "created_at": now_iso(),
            "locked": False,
            "revealed": False
        }

        session["status"] = "LIVE"
        session["current_question"] = question
        session["questions"][question_id] = question
        session["responses"][question_id] = {}

        conn = get_db()
        conn.execute(
            "INSERT INTO questions (id, session_id, kind, prompt, options_json, multi_select, timer_sec, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                question_id,
                session_id,
                kind,
                prompt,
                str(options),
                1 if multi_select else 0,
                timer_sec,
                "LIVE",
                now_iso()
            )
        )
        conn.execute("UPDATE sessions SET status=? WHERE id=?", ("LIVE", session_id))
        conn.commit()
        conn.close()

        socketio.emit("new_question", {
            "session_id": session_id,
            "question": question
        }, room=session_id)

    @socketio.on("submit_answer")
    def handle_submit_answer(data):
        session_id = data.get("session_id")
        question_id = data.get("question_id")
        user_id = data.get("user_id")
        answer = data.get("answer")

        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        question = session["questions"].get(question_id)
        if not question:
            emit("error", {"message": "question_not_found"})
            return

        if question.get("locked"):
            emit("error", {"message": "question_locked"})
            return

        participants = session["participants"]
        student = participants.get(user_id, {"name": "Student"})

        response_map = session["responses"].setdefault(question_id, {})
        response_map[user_id] = {
            "student_id": user_id,
            "student_name": student.get("name", "Student"),
            "answer": answer,
            "created_at": now_iso()
        }

        aggregate = aggregate_results(question, response_map)

        socketio.emit("answer_received", {
            "session_id": session_id,
            "question_id": question_id,
            "response_count": aggregate["response_count"],
            "distribution": aggregate.get("distribution", {})
        }, room=session_id)

    @socketio.on("teacher_lock_question")
    def handle_teacher_lock_question(data):
        session_id = data.get("session_id")
        question_id = data.get("question_id")

        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        question = session["questions"].get(question_id)
        if not question:
            emit("error", {"message": "question_not_found"})
            return

        question["locked"] = True
        question["status"] = "LOCKED"

        conn = get_db()
        conn.execute("UPDATE questions SET status=? WHERE id=?", ("LOCKED", question_id))

        for response in session["responses"].get(question_id, {}).values():
            conn.execute(
                "INSERT INTO responses (id, session_id, question_id, student_id, student_name, answer_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    f"resp_{uuid.uuid4().hex[:10]}",
                    session_id,
                    question_id,
                    response["student_id"],
                    response["student_name"],
                    str(response["answer"]),
                    response["created_at"]
                )
            )

        conn.commit()
        conn.close()

        socketio.emit("question_locked", {
            "session_id": session_id,
            "question_id": question_id
        }, room=session_id)

    @socketio.on("teacher_reveal_results")
    def handle_teacher_reveal_results(data):
        session_id = data.get("session_id")
        question_id = data.get("question_id")

        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        question = session["questions"].get(question_id)
        if not question:
            emit("error", {"message": "question_not_found"})
            return

        question["revealed"] = True
        results = aggregate_results(question, session["responses"].get(question_id, {}))

        socketio.emit("results_revealed", {
            "session_id": session_id,
            "question_id": question_id,
            "results": results
        }, room=session_id)

    @socketio.on("teacher_end_session")
    def handle_teacher_end_session(data):
        session_id = data.get("session_id")
        session = ACTIVE_SESSIONS.get(session_id)
        if not session:
            emit("error", {"message": "session_not_found"})
            return

        session["status"] = "ENDED"

        conn = get_db()
        conn.execute(
            "UPDATE sessions SET status=?, ended_at=? WHERE id=?",
            ("ENDED", now_iso(), session_id)
        )
        conn.commit()
        conn.close()

        socketio.emit("session_ended", {
            "session_id": session_id,
            "ended_at": now_iso()
        }, room=session_id)