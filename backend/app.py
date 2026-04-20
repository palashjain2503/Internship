import traceback
import uuid

from flask import Flask, jsonify, request

from agent import run_case_generation
from db import add_version, create_case, get_case, get_latest_version, init_db, list_cases

app = Flask(__name__)
init_db()


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
    return jsonify({"status": "not_implemented", "items": []})


@app.get("/api/sessions/<session_id>")
def get_session(session_id):
    return jsonify({"status": "not_implemented", "session_id": session_id})


@app.get("/api/questions")
def list_questions():
    return jsonify({"status": "not_implemented", "items": []})


@app.get("/api/analytics")
def analytics_summary():
    return jsonify({"status": "not_implemented", "summary": {}})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
