import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

DB_PATH = "livecase.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _connect()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cases (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                draft_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS case_versions (
                id TEXT PRIMARY KEY,
                case_id TEXT NOT NULL,
                content_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(case_id) REFERENCES cases(id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def create_case(case_id: str, draft: Dict[str, Any]) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO cases (id, status, draft_json, created_at) VALUES (?, ?, ?, ?)",
            (case_id, "draft", json.dumps(draft), datetime.utcnow().isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def list_cases() -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        rows = conn.execute("SELECT id, status, draft_json, created_at FROM cases ORDER BY created_at DESC").fetchall()
        items = []
        for row in rows:
            draft = json.loads(row["draft_json"])
            items.append({
                "id": row["id"],
                "status": row["status"],
                "title": draft.get("title"),
                "subject": draft.get("subject"),
                "created_at": row["created_at"],
            })
        return items
    finally:
        conn.close()


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = _connect()
    try:
        row = conn.execute("SELECT id, status, draft_json, created_at FROM cases WHERE id = ?", (case_id,)).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "status": row["status"],
            "draft": json.loads(row["draft_json"]),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


def add_version(case_id: str, version_id: str, content: Dict[str, Any]) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO case_versions (id, case_id, content_json, created_at) VALUES (?, ?, ?, ?)",
            (version_id, case_id, json.dumps(content), datetime.utcnow().isoformat()),
        )
        conn.execute("UPDATE cases SET status = ? WHERE id = ?", ("generated", case_id))
        conn.commit()
    finally:
        conn.close()


def get_latest_version(case_id: str) -> Optional[Dict[str, Any]]:
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT id, content_json, created_at FROM case_versions WHERE case_id = ? ORDER BY created_at DESC LIMIT 1",
            (case_id,),
        ).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "content": json.loads(row["content_json"]),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()
