# backend/faculty_live/question_service.py

import secrets
from datetime import datetime, timezone

from .question_store import list_questions_for_session, save_question
from .service import fetch_session


DEFAULT_QUESTION_TYPE = "open_text"
DEFAULT_QUESTION_STATUS = "draft"


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def generate_question_id():
    return f"q_{secrets.token_hex(4)}"


def create_question_for_session(session_id, prompt, question_type=DEFAULT_QUESTION_TYPE):
    session = fetch_session(session_id)
    if session is None:
        raise LookupError("session not found")

    now = _utc_now_iso()
    question = {
        "question_id": generate_question_id(),
        "session_id": session_id,
        "prompt": prompt,
        "type": question_type,
        "status": DEFAULT_QUESTION_STATUS,
        "created_at": now,
        "updated_at": now,
    }
    return save_question(question)


def list_questions_for_existing_session(session_id):
    session = fetch_session(session_id)
    if session is None:
        raise LookupError("session not found")

    return list_questions_for_session(session_id)