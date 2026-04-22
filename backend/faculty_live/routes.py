from flask import Blueprint, jsonify, request

from .schemas import (
    error_response,
    parse_create_session_request,
    parse_flow_state_request,
    session_response,
)
from .service import create_session, fetch_session, launch_session, update_flow_state


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

    return jsonify(session_response(session)), 200


@faculty_live_bp.route("/sessions/<session_id>/launch", methods=["POST"])
def launch_faculty_live_session(session_id):
    session = launch_session(session_id)
    if session is None:
        return error_response("session not found", 404)

    return jsonify(session_response(session)), 200


@faculty_live_bp.route("/sessions/<session_id>/flow-state", methods=["POST"])
def update_faculty_live_flow_state(session_id):
    try:
        data = parse_flow_state_request(request.get_json(silent=True))
    except ValueError as exc:
        return error_response(str(exc), 400)

    session, error_key = update_flow_state(session_id, data["flow_state"])
    if error_key == "not_found":
        return error_response("session not found", 404)
    if error_key == "session_not_live":
        return error_response("flow_state can only be updated after launch", 400)

    return jsonify(session_response(session)), 200
