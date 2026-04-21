from flask import Blueprint, jsonify, request

from .schemas import error_response, parse_create_session_request, session_response
from .service import create_session, fetch_session


faculty_live_bp = Blueprint("faculty_live", __name__, url_prefix="/api/faculty-live")


@faculty_live_bp.route("/sessions", methods=["POST"])
def create_faculty_live_session():
    try:
        data = parse_create_session_request(request.get_json(silent=True))
    except ValueError as exc:
        return error_response(str(exc), 400)

    session = create_session(
        request_origin=request.host_url.rstrip("/"),
        title=data["title"],
        created_by=data["created_by"],
    )
    return jsonify(session_response(session)), 201


@faculty_live_bp.route("/sessions/<session_id>", methods=["GET"])
def get_faculty_live_session(session_id):
    session = fetch_session(session_id)
    if session is None:
        return error_response("session not found", 404)

    return jsonify(session_response(session)), 2