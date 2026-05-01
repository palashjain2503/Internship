import traceback
import uuid

from flask import Flask, jsonify, request
from flask_socketio import SocketIO

from agent import run_case_generation
from db import add_version, create_case, get_case, get_latest_version, init_db, list_cases
from faculty_live import faculty_live_bp, faculty_live_join_bp
from live_realtime import ACTIVE_SESSIONS, live_bp, init_live_tables, register_socket_handlers, serialize_session

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

app.register_blueprint(faculty_live_bp)
app.register_blueprint(faculty_live_join_bp)
app.register_blueprint(live_bp)

init_db()
init_live_tables()
register_socket_handlers(socketio)

@app.get("/api/health")
def health_check():
    return jsonify({"status": "ok", "service": "livecase-backend"})

@app.get("/api/cases")
def list_cases_endpoint():
    return jsonify({"items": list_cases()})

@app.post("/api/cases")
def create_case_endpoint():
    payload = request.get_json(force=True) or {}
    case_id = f"case_{uuid.uuid4().hex[:10]}"
    create_case(case_id, payload)
    return jsonify({"id": case_id, "draft": payload})

@app.get("/api/cases/<case_id>")
def get_case_endpoint(case_id):
    case = get_case(case_id)
    if not case:
        return jsonify({"error": "not_found"}), 404
    latest = get_latest_version(case_id)
    return jsonify({"case": case, "latest_version": latest})

@app.post("/api/cases/<case_id>/generate")
def generate_case_endpoint(case_id):
    case = get_case(case_id)
    if not case:
        return jsonify({"error": "not_found"}), 404
    try:
        result = run_case_generation(case["draft"])
        case_doc = result.get("case", {})
        logs = result.get("logs", [])
        for line in logs:
            print(f"[agent] {line}")
        version_id = f"ver_{uuid.uuid4().hex[:10]}"
        add_version(case_id, version_id, case_doc)
        return jsonify({"version_id": version_id, "case": case_doc, "logs": logs})
    except Exception as exc:
        app.logger.error("Generation failed: %s", exc)
        app.logger.error(traceback.format_exc())
        return jsonify({"error": "generation_failed", "message": str(exc)}), 500

@app.get("/api/sessions")
def list_sessions():
    items = [serialize_session(session) for session in ACTIVE_SESSIONS.values()]
    return jsonify({"status": "ok", "items": items})

@app.get("/api/sessions/<session_id>")
def get_session(session_id):
    session = ACTIVE_SESSIONS.get(session_id)
    if not session:
        return jsonify({"error": "not_found"}), 404
    return jsonify({"status": "ok", "session": serialize_session(session)})

@app.get("/api/questions")
def list_questions():
    items = []
    for session in ACTIVE_SESSIONS.values():
        for question in session["questions"].values():
            items.append(question)
    return jsonify({"status": "ok", "items": items})

@app.get("/api/analytics")
def analytics_summary():
    active_sessions = len(ACTIVE_SESSIONS)
    active_participants = sum(session.get("participant_count", 0) for session in ACTIVE_SESSIONS.values())
    question_count = sum(len(session.get("questions", {})) for session in ACTIVE_SESSIONS.values())
    return jsonify({
        "status": "ok",
        "summary": {
            "active_sessions": active_sessions,
            "active_participants": active_participants,
            "question_count": question_count
        }
    })

if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=5050)