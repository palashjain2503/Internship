from copy import deepcopy


_sessions = {}


def save_session(session):
    _sessions[session["session_id"]] = deepcopy(session)
    return deepcopy(_sessions[session["session_id"]])


def get_session(session_id):
    session = _sessions.get(session_id)
    if session is None:
        return None
    return deepcopy(session)


def list_sessions():
    return [deepcopy(session) for session in _sessions.values()]