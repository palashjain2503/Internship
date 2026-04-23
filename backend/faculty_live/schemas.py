ALLOWED_FLOW_STATES = {
    "waiting",
    "discussion",
}

DEFAULT_QUESTION_TYPE = "open_text"


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


def parse_flow_state_request(payload):
    payload = payload or {}
    flow_state = payload.get("flow_state")

    if not isinstance(flow_state, str) or not flow_state.strip():
        raise ValueError("flow_state must be a non-empty string")

    flow_state = flow_state.strip()

    if flow_state not in ALLOWED_FLOW_STATES:
        raise ValueError("flow_state must be one of: waiting, discussion")

    return {
        "flow_state": flow_state,
    }


def parse_create_question_request(payload):
    payload = payload or {}

    prompt = payload.get("prompt")
    question_type = payload.get("type", DEFAULT_QUESTION_TYPE)

    if prompt is None:
        raise ValueError("prompt is required")

    if not isinstance(prompt, str):
        raise ValueError("prompt must be a string")

    prompt = prompt.strip()
    if not prompt:
        raise ValueError("prompt is required")

    if len(prompt) > 1000:
        raise ValueError("prompt must be at most 1000 characters")

    if question_type is None:
        question_type = DEFAULT_QUESTION_TYPE

    if not isinstance(question_type, str):
        raise ValueError("type must be a string")

    question_type = question_type.strip() or DEFAULT_QUESTION_TYPE

    if question_type != DEFAULT_QUESTION_TYPE:
        raise ValueError('type must be "open_text"')

    return {
        "prompt": prompt,
        "type": DEFAULT_QUESTION_TYPE,
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
            "flow_state": session.get("flow_state", "waiting"),
            "created_at": session["created_at"],
            "updated_at": session["updated_at"],
            "qr_payload": session["qr_payload"],
        },
    }


def join_session_response(session):
    return {
        "ok": True,
        "session": {
            "session_id": session["session_id"],
            "session_code": session["session_code"],
            "title": session["title"],
            "status": session["status"],
            "flow_state": session.get("flow_state", "waiting"),
            "created_at": session["created_at"],
            "updated_at": session["updated_at"],
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
