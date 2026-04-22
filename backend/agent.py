import asyncio
import json
import os
import re
from itertools import cycle
from threading import Lock
from io import BytesIO
from datetime import datetime
from typing import Any, Dict, List

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pypdf import PdfReader
from docx import Document

load_dotenv()

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
SUMMARY_MODEL = os.getenv("GROQ_SUMMARY_MODEL", DEFAULT_MODEL)


def _env_first(*names: str) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    return None


_summary_keys = [
    _env_first("GROQ_API_KEY1", "KEY1"),
    _env_first("GROQ_API_KEY2", "KEY2"),
]
_core_keys = [
    _env_first("GROQ_API_KEY", "KEY"),
    _env_first("GROQ_API_KEY3", "KEY3"),
]

_summary_keys = [k for k in _summary_keys if k]
_core_keys = [k for k in _core_keys if k]

_fallback_key = _env_first("GROQ_API_KEY", "KEY")
_summary_key_cycle = cycle(_summary_keys or [_fallback_key])
_core_key_cycle = cycle(_core_keys or [_fallback_key])
_summary_key_lock = Lock()
_core_key_lock = Lock()


def _get_llm(api_key_override: str | None = None, model_override: str | None = None) -> ChatGroq:
    api_key = api_key_override or _env_first("GROQ_API_KEY", "KEY")
    if not api_key:
        raise RuntimeError("No Groq API key found. Set GROQ_API_KEY/KEY or the KEY1-KEY3 variants.")

    return ChatGroq(
        api_key=api_key,
        model=model_override or DEFAULT_MODEL,
        temperature=0.3,
        max_tokens=5000  # 🔥 VERY IMPORTANT
    )


def _next_key(pool_cycle, pool_lock: Lock) -> str | None:
    with pool_lock:
        return next(pool_cycle)


def _get_summary_llm() -> ChatGroq:
    api_key = _next_key(_summary_key_cycle, _summary_key_lock)
    return _get_llm(api_key_override=api_key, model_override=SUMMARY_MODEL)


def _get_core_llm() -> ChatGroq:
    api_key = _next_key(_core_key_cycle, _core_key_lock)
    return _get_llm(api_key_override=api_key)


_summary_semaphore = asyncio.Semaphore(2)
_draft_semaphore = asyncio.Semaphore(2)


async def _ainvoke_limited(llm: ChatGroq, messages: List[Dict[str, str]], semaphore: asyncio.Semaphore, retries: int = 1) -> str:
    async with semaphore:
        try:
            return (await llm.ainvoke(messages)).content
        except Exception as exc:
            if retries > 0 and "rate_limit" in str(exc).lower():
                await asyncio.sleep(9)
                return (await llm.ainvoke(messages)).content
            raise


def _safe_json(text: str, fallback: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                return fallback
        return fallback


def _preview(value: Any, limit: int = 800) -> str:
    try:
        text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=True)
    except Exception:
        text = str(value)
    return text[:limit]


def _word_count(text: str) -> int:
    return len((text or "").split())


def _with_state(state: Dict[str, Any], **updates: Any) -> Dict[str, Any]:
    merged = dict(state)
    merged.update(updates)
    return merged


def _sanitize_draft_for_prompt(draft: Dict[str, Any]) -> Dict[str, Any]:
    safe = dict(draft)
    files = safe.get("files", []) or []
    safe["files"] = [{"name": f.get("name"), "size": f.get("size")} for f in files]
    file_texts = safe.get("file_texts", []) or []
    safe["file_texts"] = [
        {"name": f.get("name"), "text": _preview(f.get("text", ""), 300)}
        for f in file_texts
    ]
    return safe


def _has_meaningful_input(draft: Dict[str, Any]) -> bool:
    if not draft:
        return False
    fields = [
        draft.get("title"),
        draft.get("subject"),
        draft.get("course"),
        draft.get("dilemma"),
        draft.get("options"),
        draft.get("constraints"),
        draft.get("instructor"),
    ]
    if any(isinstance(v, str) and v.strip() for v in fields):
        return True

    list_fields = [
        draft.get("links", []),
        draft.get("frameworks", []),
        draft.get("topics", []),
        draft.get("files", []),
        draft.get("file_texts", []),
    ]
    for items in list_fields:
        if any(isinstance(v, str) and v.strip() for v in items):
            return True
        if any(isinstance(v, dict) and (v.get("name") or v.get("text")) for v in items):
            return True
    return False


def _force_json_case(llm: ChatGroq, prompt_text: str) -> Dict[str, Any]:
    repair_prompt = {
        "role": "user",
        "content": (
            "Return ONLY valid JSON. No markdown, no prose.\n"
            "JSON schema: { title, subtitle, industry, sections: [{heading, body}] }.\n\n"
            + prompt_text
        )
    }
    resp = llm.invoke([repair_prompt])
    return _safe_json(resp.content, {})


async def _force_json_case_async(llm: ChatGroq, prompt_text: str) -> Dict[str, Any]:
    repair_prompt = {
        "role": "user",
        "content": (
            "Return ONLY valid JSON. No markdown, no prose.\n"
            "JSON schema: { title, subtitle, industry, sections: [{heading, body}] }.\n\n"
            + prompt_text
        )
    }
    resp = await llm.ainvoke([repair_prompt])
    return _safe_json(resp.content, {})


def _make_outline(llm: ChatGroq, draft: Dict[str, Any], brief: Dict[str, Any], insights: Dict[str, Any], target_words: int) -> Dict[str, Any]:
    prompt = {
        "role": "user",
        "content": (
            "Return ONLY valid JSON. No markdown, no prose.\n"
            "Create a case outline with section headings and target word counts.\n"
            f"TARGET_WORDS: {target_words}\n\n"
            f"INPUTS: {json.dumps(draft)[:2600]}\n\n"
            f"BRIEF: {json.dumps(brief)[:1800]}\n\n"
            f"INSIGHTS: {json.dumps(insights)[:1800]}\n\n"
            "JSON schema: { title, subtitle, industry, sections: [{heading, target_words}] }"
        ),
    }
    raw = llm.invoke([prompt]).content
    outline = _safe_json(raw, {})
    return outline if outline.get("sections") else _force_json_case(llm, prompt["content"])


async def _make_outline_async(llm: ChatGroq, draft: Dict[str, Any], brief: Dict[str, Any], insights: Dict[str, Any], target_words: int) -> Dict[str, Any]:
    prompt = {
        "role": "user",
        "content": (
            "Return ONLY valid JSON. No markdown, no prose.\n"
            "Create a case outline with section headings and target word counts.\n"
            f"TARGET_WORDS: {target_words}\n\n"
            f"INPUTS: {json.dumps(draft)[:2600]}\n\n"
            f"BRIEF: {json.dumps(brief)[:1800]}\n\n"
            f"INSIGHTS: {json.dumps(insights)[:1800]}\n\n"
            "JSON schema: { title, subtitle, industry, sections: [{heading, target_words}] }"
        ),
    }
    raw = await _ainvoke_limited(llm, [prompt], _draft_semaphore)
    outline = _safe_json(raw, {})
    return outline if outline.get("sections") else await _force_json_case_async(llm, prompt["content"])


async def _summarize_text(llm: ChatGroq, name: str, text: str) -> str:
    if not text or len(text) < 100:
        return text

    prompt = (
        f"Summarize the following content from '{name}' for a business case study. "
        "Extract key facts, figures, and strategic dilemmas. Keep it under 200 words.\n\n"
        f"CONTENT: {text[:4000]}"
    )
    content = await _ainvoke_limited(llm, [{"role": "user", "content": prompt}], _summary_semaphore)
    return content.strip()


def _fetch_link_text(url: str, max_chars: int = 2500) -> Dict[str, Any]:
    try:
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else url
        text = " ".join(soup.stripped_strings)[:max_chars]
        return {"url": url, "title": title, "text": text}
    except Exception as exc:
        return {"url": url, "title": url, "text": "", "error": str(exc)}


def _extract_file_texts(files: List[Dict[str, Any]], max_chars: int = 1200) -> List[Dict[str, Any]]:
    extracted = []
    for item in files or []:
        name = item.get("name") or "file"
        content = item.get("content")
        if not content:
            continue
        raw = content
        if isinstance(raw, dict) and "data" in raw:
            raw = raw["data"]
        try:
            data = bytes(raw) if isinstance(raw, list) else bytes()
        except Exception:
            data = bytes()

        text = ""
        try:
            if name.lower().endswith(".pdf"):
                reader = PdfReader(BytesIO(data))
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
            elif name.lower().endswith(".docx"):
                doc = Document(BytesIO(data))
                text = "\n".join(p.text for p in doc.paragraphs)
            else:
                text = data.decode("utf-8", errors="ignore")
        except Exception as exc:
            text = f"[failed to parse {name}: {exc}]"

        extracted.append({
            "name": name,
            "text": text[:max_chars]
        })
    return extracted


# 🔥 Extract insights from sources
def extract_source_insights(sources):
    if not sources:
        return {"insights": [], "facts": [], "trends": []}

    llm = _get_core_llm()

    prompt = {
        "role": "user",
        "content": (
            "You are a business analyst.\n"
            "Extract useful insights from the following sources.\n\n"
            f"{json.dumps(sources)[:8000]}\n\n"
            "Return STRICT JSON:\n"
            "{ insights: [...], facts: [...], trends: [...] }"
        ),
    }

    resp = llm.invoke([prompt])
    return _safe_json(resp.content, {"insights": [], "facts": [], "trends": []})


async def extract_source_insights_async(sources):
    if not sources:
        return {"insights": [], "facts": [], "trends": []}

    llm = _get_core_llm()
    prompt = {
        "role": "user",
        "content": (
            "You are a business analyst.\n"
            "Extract useful insights from the following sources.\n\n"
            f"{json.dumps(sources)[:8000]}\n\n"
            "Return STRICT JSON:\n"
            "{ insights: [...], facts: [...], trends: [...] }"
        ),
    }
    content = await _ainvoke_limited(llm, [prompt], _draft_semaphore)
    return _safe_json(content, {"insights": [], "facts": [], "trends": []})


def build_case_graph() -> StateGraph:
    graph = StateGraph(state_schema=dict)

    def trim_sources(items: List[Dict[str, Any]], max_total_chars: int = 6000) -> List[Dict[str, Any]]:
        trimmed = []
        budget = max_total_chars
        for item in items:
            text = item.get("text", "")
            if not text:
                trimmed.append(item)
                continue
            if budget <= 0:
                break
            chunk = text[:budget]
            trimmed.append({**item, "text": chunk})
            budget -= len(chunk)
        return trimmed

    # STEP 1: Normalize input
    def normalize(state):
        draft = state.get("draft") or {}

        draft.setdefault("links", [])
        draft.setdefault("frameworks", [])
        draft.setdefault("constraints", "")
        draft.setdefault("topics", [])
        draft.setdefault("pages", 2)
        draft.setdefault("files", [])
        draft["file_texts"] = _extract_file_texts(draft.get("files", []))

        logs = state.get("logs", [])
        logs.append("normalize: prepared draft")
        logs.append(f"input.draft: {_preview(draft, 600)}")
        if draft.get("file_texts"):
            logs.append(f"input.files: {[f.get('name') for f in draft.get('file_texts', [])]}")

        file_texts = draft.get("file_texts", [])
        if file_texts:
            logs.append("files.count: " + str(len(file_texts)))
            for f in file_texts:
                logs.append(f"file.{f.get('name')}.preview: {_preview(f.get('text', ''), 300)}")

        draft_prompt = _sanitize_draft_for_prompt(draft)
        logs.append(f"prompt.draft: {_preview(draft_prompt, 600)}")

        return _with_state(state, draft=draft, draft_prompt=draft_prompt, logs=logs)

    # STEP 2: Fetch sources
    async def fetch_and_summarize_sources(state):
        draft = state.get("draft", {})
        links = draft.get("links", [])
        files = draft.get("file_texts", [])

        logs = state.get("logs", [])
        logs.append("fetch_sources: starting parallel fetch + summarize")

        if not any((u or "").strip() for u in links) and not files:
            logs.append("fetch_sources: skipped (no links or files)")
            return _with_state(state, summarized_sources=[], logs=logs)

        tasks = []

        for url in links:
            if not url:
                continue

            async def process_link(u=url):
                data = await asyncio.to_thread(_fetch_link_text, u)
                summary = await _summarize_text(_get_summary_llm(), data.get("title") or u, data.get("text", ""))
                return {"url": u, "title": data.get("title") or u, "summary": summary, "error": data.get("error")}

            tasks.append(process_link())

        for file_obj in files:
            name = file_obj.get("name") or "file"
            text = file_obj.get("text", "")

            async def process_file(file_name=name, file_text=text):
                summary = await _summarize_text(_get_summary_llm(), file_name, file_text)
                return {"url": f"file:{file_name}", "title": file_name, "summary": summary}

            tasks.append(process_file())

        summarized_results = await asyncio.gather(*tasks) if tasks else []

        logs.append(f"fetch_sources: summarized {len(summarized_results)} sources")
        if summarized_results:
            titles = [s.get("title", "") for s in summarized_results]
            logs.append("sources: " + "; ".join(titles))
            errors = [s.get("error") for s in summarized_results if s.get("error")]
            if errors:
                logs.append("sources.errors: " + "; ".join(errors))

        return _with_state(state, summarized_sources=summarized_results, logs=logs)

    # STEP 3: Extract insights
    async def extract_insights(state):
        summarized_sources = state.get("summarized_sources", [])
        combined = trim_sources([
            {"url": s.get("url"), "title": s.get("title"), "text": s.get("summary", "")}
            for s in summarized_sources
        ])

        insights = await extract_source_insights_async(combined)

        logs = state.get("logs", [])
        logs.append("extract_insights: extracted knowledge")
        logs.append(f"insights.preview: {_preview(insights, 600)}")
        logs.append(f"combined.sources.count: {len(combined)}")
        logs.append(f"combined.sources.chars: {sum(len(s.get('text', '')) for s in combined)}")
        return _with_state(state, insights=insights, logs=logs)

    # STEP 4: Analyze requirements
    async def analyze_requirements(state):
        llm = _get_core_llm()
        draft = state.get("draft_prompt", state.get("draft", {}))
        insights = state.get("insights", {})

        if not _has_meaningful_input(draft) and not insights:
            logs = state.get("logs", [])
            logs.append("analyze: skipped (no meaningful input)")
            return _with_state(state, brief={}, logs=logs)

        prompt = {
            "role": "user",
            "content": (
                "You are a professional MBA case designer.\n\n"
                 "Design Long Case studies:\n"
                "CRITICAL INSTRUCTIONS:\n"
                "- Use the user's inputs as the source of truth\n"
                "- Do not change industry/company/domain\n"
                "- If constraints are given, include them\n"
                "- If a dilemma is given, make it the central decision\n\n"
                f"USER INPUTS:\n{json.dumps(draft)[:1600]}\n\n"
                f"INSIGHTS:\n{json.dumps(insights)[:1600]}\n\n"
                "Return JSON with keys: summary, industry, decision, stakeholders, constraints,"
                " learning_objectives, risks, recommended_sections."
            ),
        }

        logs = state.get("logs", [])
        logs.append(f"analyze.prompt: {_preview(prompt['content'], 800)}")
        content = await _ainvoke_limited(llm, [prompt], _draft_semaphore)
        logs.append(f"analyze.raw: {_preview(content, 800)}")
        brief = _safe_json(content, {})

        logs.append("analyze: brief created")

        return _with_state(state, brief=brief, logs=logs)

    # STEP 5: Draft case
    async def draft_case(state):
        draft = state.get("draft_prompt", state.get("draft", {}))
        brief = state.get("brief", {})
        insights = state.get("insights", {})

        if not _has_meaningful_input(draft) and not brief and not insights:
            logs = state.get("logs", [])
            logs.append("draft: skipped (no meaningful input)")
            case_doc = {
                "title": "Untitled case",
                "subtitle": "",
                "industry": "",
                "sections": [
                    {"heading": "Overview", "body": "Add inputs to generate a full case study."}
                ]
            }
            return _with_state(state, case_doc=case_doc, target_words=0, logs=logs)

        llm = _get_core_llm()

        pages = max(1, int(draft.get("pages", 2)))
        target_words = pages * 550

        logs = state.get("logs", [])
        outline = await _make_outline_async(llm, draft, brief, insights, target_words)
        logs.append(f"outline.preview: {_preview(outline, 800)}")

        sections = []
        outline_sections = outline.get("sections", []) or []
        if not outline_sections:
            outline_sections = [
                {"heading": "Overview", "target_words": max(400, int(target_words * 0.3))},
                {"heading": "Background", "target_words": max(400, int(target_words * 0.3))},
                {"heading": "Decision", "target_words": max(400, int(target_words * 0.4))}
            ]

        async def generate_section(section: Dict[str, Any], idx: int) -> Dict[str, Any]:
            heading = section.get("heading") or f"Section {idx + 1}"
            section_words = int(section.get("target_words") or max(300, target_words // max(1, len(outline_sections))))
            section_prompt = (
                "Write ONE section of a business school case study.\n"
                "Use the inputs and insights. Keep factual tone.\n"
                f"HEADING: {heading}\n"
                f"TARGET_WORDS: {section_words}\n\n"
                f"INPUTS: {json.dumps(draft)[:2000]}\n\n"
                f"BRIEF: {json.dumps(brief)[:1600]}\n\n"
                f"INSIGHTS: {json.dumps(insights)[:1600]}\n\n"
                "Return ONLY the section body text."
            )
            body = await _ainvoke_limited(_get_core_llm(), [{"role": "user", "content": section_prompt}], _draft_semaphore)
            if _word_count(body) < max(180, int(section_words * 0.6)):
                expand = (
                    "Expand the section to meet target length. Keep details consistent.\n"
                    f"TARGET_WORDS: {section_words}\n\n"
                    f"DRAFT: {body[:1400]}\n"
                )
                body = await _ainvoke_limited(_get_core_llm(), [{"role": "user", "content": expand}], _draft_semaphore)
            return {
                "heading": heading,
                "body": body.strip(),
                "words": _word_count(body)
            }

        section_tasks = [generate_section(s, i) for i, s in enumerate(outline_sections)]
        sections = await asyncio.gather(*section_tasks)
        for idx, section in enumerate(sections):
            logs.append(f"section.{idx + 1}.heading: {section.get('heading')}")
            logs.append(f"section.{idx + 1}.words: {section.get('words')}")

        case_doc = {
            "title": outline.get("title") or draft.get("title") or "Untitled case",
            "subtitle": outline.get("subtitle") or draft.get("subtitle") or "",
            "industry": outline.get("industry") or brief.get("industry") or draft.get("subject") or "",
            "sections": [{"heading": s.get("heading"), "body": s.get("body")} for s in sections]
        }

        logs.append("draft: case generated")
        logs.append(f"draft.word_count: {_word_count(' '.join(s.get('body', '') for s in case_doc.get('sections', [])))}")

        return _with_state(state, case_doc=case_doc, target_words=target_words, logs=logs)

    # STEP 6: Finalize
    def finalize_case(state):
        case_doc = state.get("case_doc", {})
        target_words = state.get("target_words", 0)

        text = " ".join(s.get("body", "") for s in case_doc.get("sections", []))
        word_count = len(text.split())

        case_doc["word_count"] = word_count
        case_doc["target_words"] = target_words
        case_doc["generated_at"] = datetime.utcnow().strftime("%I:%M %p")

        logs = state.get("logs", [])
        logs.append("finalize: done")
        logs.append(f"case.preview: {_preview(case_doc, 800)}")

        return _with_state(state, case_doc=case_doc, logs=logs)

    # GRAPH
    graph.add_node("normalize", normalize)
    graph.add_node("fetch_sources", fetch_and_summarize_sources)
    graph.add_node("extract_insights", extract_insights)
    graph.add_node("analyze", analyze_requirements)
    graph.add_node("draft", draft_case)
    graph.add_node("finalize", finalize_case)

    graph.set_entry_point("normalize")

    graph.add_edge("normalize", "fetch_sources")
    graph.add_edge("fetch_sources", "extract_insights")
    graph.add_edge("extract_insights", "analyze")
    graph.add_edge("analyze", "draft")
    graph.add_edge("draft", "finalize")
    graph.add_edge("finalize", END)

    return graph


def run_case_generation(draft: Dict[str, Any]) -> Dict[str, Any]:
    graph = build_case_graph()
    app = graph.compile()
    try:
        result = asyncio.run(app.ainvoke({"draft": draft}))
    except RuntimeError as exc:
        raise RuntimeError("Async execution failed. Ensure no event loop is already running.") from exc

    return {
        "case": result.get("case_doc", {}),
        "logs": result.get("logs", []),
    }