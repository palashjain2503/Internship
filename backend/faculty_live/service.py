import secrets
from datetime import datetime, timezone

from .store import get_session, save_session


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def generate_session_id():
    return f"fls_{secrets.token_hex(4)}"


def generate_session_code():
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(6))


def build_join_path(session_id, session_code):
    return f"/join/live/{session_id}?code={session_code}"


def build_qr_payload(request_origin, session_id, session_code):
    join_path = build_join_path(session_id, session_code)
    join_url = f"{request_origin.rstrip('/')}{join_path}"
    return {
        "join_path": join_path,
        "join_url": join_url,
        "qr_value": join_url,
        "session_code": session_code,
    }


def create_session(request_origin, title=None, created_by="faculty"):
    session_id = generate_session_id()
    session_code = generate_session_code()
    qr_payload = build_qr_payload(request_origin, session_id, session_code)
    now = _utc_now_iso()

    session = {
        "session_id": session_id,
        "session_code": session_code,
        "title": (title or "Live Case Session").strip(),
        "created_by": created_by,
        "status": "created",
        "created_at": now,
        "updated_at": now,
        "qr_payload": qr_payload,
    }

    return save_session(session)


def fetch_session(session_id):
    return get_session(session_id)