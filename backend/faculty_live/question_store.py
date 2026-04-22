from copy import deepcopy


_questions_by_session = {}


def save_question(question):
    session_id = question["session_id"]
    if session_id not in _questions_by_session:
        _questions_by_session[session_id] = []

    _questions_by_session[session_id].append(deepcopy(question))
    return deepcopy(question)


def list_questions_for_session(session_id):
    questions = _questions_by_session.get(session_id, [])
    return [deepcopy(question) for question in questions]