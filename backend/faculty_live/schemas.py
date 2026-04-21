def parse_create_session_request(payload):
    payload = payload or {}
    title = payload.get("title")
    created_by = payload.get("created_by", "faculty")

    if title is not None and not isinstance(title, str):
        raise ValueError("title must be a string")

    if not isinstance(created_by, str) or not created_by.strip():
        raise ValueError("created_by must be a non-empty string")

    return {
        "title": title,
        "created_by": created_by.strip(),
    }


def session_response(session):
    return {
        "ok": True,
        "session": {
            "session_id": session["session_id"],
            "session_code": session["session_code"],
            "title": session["title"],
            "created_by": session["created_by"],
            "status": session["status"],
            "created_at": session["created_at"],
            "updated_at": session["updated_at"],
            "qr_payload": session["qr_payload"],
        },
    }


def error_response(message, status_code=400):
    return {
        "ok": False,
        "error": {
            "message": message,
            "status_code": status_code,
        },
    }, status_code