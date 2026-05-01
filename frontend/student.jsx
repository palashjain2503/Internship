// Student view  -  QR landing  -  read case  -  AI agent chat + live poll
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS, useMemo: useMemoS } = React;

const getSessionId = () => new URLSearchParams(window.location.search).get("session_id") || "";

// ===== JOIN SCREEN =====
const StudentJoin = ({ onJoin, caseData }) => {
  const [name, setName] = useStateS("");
  const c = caseData;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "40px 32px" }}>
      <div className="card fade-up" style={{ padding: "40px 44px", maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, margin: "0 auto 18px", background: "var(--ochre-bg)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ochre-ink)" }}>
          <Icon name="qr" size={20} />
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Room  -  HL-621</div>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 500, margin: "0 0 8px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <div className="mono dim text-xs" style={{ marginBottom: 24 }}>
          {c.instructor}  -  {c.course}
        </div>
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--ink-2)" }}>Display name <span className="dim">(optional)</span></div>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Stay anonymous, or use your initials" />
        </div>
        <Btn variant="ochre" style={{ width: "100%", justifyContent: "center", padding: "12px 16px", fontSize: 14 }} onClick={() => onJoin(name)}>
          Join the session <Icon name="arrR" size={14} />
        </Btn>
        <div className="mono dim" style={{ fontSize: 10, marginTop: 14, lineHeight: 1.5 }}>
          No account needed. Your instructor won't see your real name unless you write it.
        </div>
      </div>
    </div>
  );
};

// ===== CASE READER =====
const StudentReader = ({ onConfirmRead, studentName, caseData }) => {
  const c = caseData;
  const [scrollPct, setScrollPct] = useStateS(0);
  const [confirmed, setConfirmed] = useStateS(false);
  const wrapRef = useRefS(null);

  useEffectS(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => {
      const pct = Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)) || 0;
      setScrollPct(pct);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const canConfirm = scrollPct >= 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--rule)", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="flex items-center gap-3">
          <Chip icon="dot" tone="sage">Connected</Chip>
          <span className="mono dim text-xs">HL-621  -  {studentName || "Anonymous"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="mono text-xs dim">{scrollPct}% read</div>
          <div style={{ width: 80 }}>
            <Progress value={scrollPct} color="var(--ochre)" />
          </div>
        </div>
      </div>

      <div ref={wrapRef} style={{ flex: 1, overflow: "auto", padding: "40px 32px 140px" }}>
        <div className="doc" style={{ maxWidth: 660, margin: "0 auto", padding: "52px 60px 64px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{c.course}  -  {c.subject}</div>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.015em", lineHeight: 1.15 }}>
            {c.title}
          </h1>
          <p className="serif" style={{ fontSize: 16, color: "var(--ink-2)", fontStyle: "italic", margin: "0 0 20px", lineHeight: 1.45 }}>
            {c.subtitle}
          </p>
          <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
            <span className="mono dim text-xs">{c.instructor}</span>
            <span className="dim"> - </span>
            <span className="mono dim text-xs">{c.readingTime}</span>
          </div>
          <div className="rule" style={{ marginBottom: 22 }} />

          {c.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 20 }}>
              <h2 className="serif" style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px" }}>{s.heading}</h2>
              <p className="serif" style={{ fontSize: 14.5, lineHeight: 1.68, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}>{s.body}</p>
            </section>
          ))}

          <div className="rule-dashed" style={{ margin: "24px 0 16px" }} />
          <div className="eyebrow" style={{ marginBottom: 10 }}>Exhibits</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {c.exhibits.map((e, i) => (
              <div key={i}>
                <Placeholder label={e.label} aspect="4 / 3" kind={e.kind} />
                <div className="mono dim text-xs" style={{ marginTop: 4 }}>{e.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "14px 32px",
        background: "linear-gradient(to top, var(--paper) 60%, transparent)",
        pointerEvents: "none"
      }}>
        <div style={{ maxWidth: 660, margin: "0 auto", pointerEvents: "auto" }}>
          <div className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, background: "var(--paper)", boxShadow: "var(--shadow-lg)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: canConfirm ? "pointer" : "not-allowed", opacity: canConfirm ? 1 : 0.5 }}>
              <input type="checkbox" checked={confirmed} disabled={!canConfirm} onChange={e => setConfirmed(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--ochre)" }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>I've read the case and I'm ready to discuss.</span>
              {!canConfirm && <span className="mono dim" style={{ fontSize: 10 }}> -  scroll to continue</span>}
            </label>
            <Btn variant="ochre" size="sm" disabled={!confirmed} iconRight="arrR" onClick={onConfirmRead}>
              Enter discussion
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== DISCUSSION (case + agent + live question) =====
const StudentDiscussion = ({ studentName, sessionState, dispatch, studentId, caseData, sessionId }) => {
  const c = caseData;
  const liveQ = sessionState.questions.find(q => q.id === sessionState.activeQuestionId);
  const [agentOpen, setAgentOpen] = useStateS(true);

  return (
    <div style={{ display: "grid", gridTemplateColumns: agentOpen ? "1fr 380px" : "1fr 0", height: "100%", minHeight: 0, transition: "grid-template-columns 0.25s ease" }}>
      <div style={{ overflow: "auto", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--paper)", borderBottom: "1px solid var(--rule)", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="flex items-center gap-3">
            <Chip icon="dot" tone="sage">In session</Chip>
            <span className="mono dim text-xs">HL-621  -  {studentName || "Anonymous"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" icon="book">Case</Btn>
            {!agentOpen && <Btn variant="default" size="sm" icon="chat" onClick={() => setAgentOpen(true)}>Ask the agent</Btn>}
          </div>
        </div>

        <div style={{ padding: "24px 28px 60px", maxWidth: 720, margin: "0 auto" }}>
          {liveQ && liveQ.status !== "draft" && (
            <StudentLiveQuestion q={liveQ} dispatch={dispatch} studentId={studentId} sessionId={sessionId} answers={sessionState.answers[liveQ.id] || []} results={sessionState.results[liveQ.id]} attendance={sessionState.attendance} />
          )}

          <div className="doc" style={{ padding: "40px 48px", marginTop: liveQ ? 24 : 0 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{c.course}  -  {c.subject}</div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: "0 0 10px", letterSpacing: "-0.01em" }}>{c.title}</h2>
            <p className="serif" style={{ fontSize: 14.5, color: "var(--ink-2)", fontStyle: "italic", margin: "0 0 16px" }}>{c.subtitle}</p>
            <div className="rule" style={{ marginBottom: 16 }} />
            {c.sections.map((s, i) => (
              <section key={i} style={{ marginBottom: 16 }}>
                <h3 className="serif" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{s.heading}</h3>
                <p className="serif" style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)", margin: 0 }}>{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>

      {agentOpen && <AgentPanel onClose={() => setAgentOpen(false)} caseData={caseData} />}
    </div>
  );
};

// ===== LIVE QUESTION CARD (student) =====
const StudentLiveQuestion = ({ q, dispatch, studentId, answers, results, attendance, sessionId }) => {
  const [selected, setSelected] = useStateS([]);
  const [openText, setOpenText] = useStateS("");
  const myAnswer = answers.find(a => a.studentId === studentId);
  const submitted = !!myAnswer;
  const revealed = q.status === "revealed";

  const submit = () => {
    const currentSessionId = sessionId || getSessionId();
    if (!currentSessionId) {
      console.warn("Missing session_id in URL query string");
      return;
    }

    if (q.kind === "poll") {
      if (selected.length === 0) return;
      const answer = selected;
      window.socket?.emit("submit_answer", {
        session_id: currentSessionId,
        question_id: q.id,
        user_id: studentId,
        answer
      });
      dispatch({ type: "answer", qid: q.id, answer: { studentId, choices: selected } });
    } else {
      const text = openText.trim();
      if (!text) return;
      window.socket?.emit("submit_answer", {
        session_id: currentSessionId,
        question_id: q.id,
        user_id: studentId,
        answer: text
      });
      dispatch({ type: "answer", qid: q.id, answer: { studentId, text } });
    }
  };

  const respCount = answers.length;

  return (
    <div className="card fade-up" style={{ padding: 0, overflow: "hidden", borderColor: "var(--ochre)", borderWidth: 1.5, boxShadow: "var(--shadow)" }}>
      <div style={{ padding: "10px 16px", background: "var(--ochre-bg)", borderBottom: "1px solid var(--ochre)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="mono text-xs" style={{ color: "var(--ochre-ink)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live question from your instructor</span>
        </div>
        <span className="mono text-xs" style={{ color: "var(--ochre-ink)", opacity: 0.8 }}>{q.kind === "poll" ? (q.multi ? "Multi-select" : "Single-choice") : "Open response"}</span>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        <div className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.4, marginBottom: 16, textWrap: "pretty" }}>
          {q.prompt}
        </div>

        {q.kind === "poll" ? (
          <div className="flex col gap-2">
            {q.options.map(o => {
              const picked = selected.includes(o.id) || (myAnswer && myAnswer.choices && myAnswer.choices.includes(o.id));
              const count = results ? (results[o.id] || 0) : 0;
              const pct = respCount > 0 ? Math.round((count / respCount) * 100) : 0;
              return (
                <button
                  key={o.id}
                  disabled={submitted}
                  onClick={() => setSelected(q.multi ? (selected.includes(o.id) ? selected.filter(x => x !== o.id) : [...selected, o.id]) : [o.id])}
                  style={{
                    textAlign: "left",
                    position: "relative",
                    padding: "12px 16px",
                    border: `1.5px solid ${picked ? "var(--ink)" : "var(--rule)"}`,
                    borderRadius: 4,
                    background: "var(--paper)",
                    cursor: submitted ? "default" : "pointer",
                    transition: "all 0.15s",
                    overflow: "hidden",
                    fontFamily: "var(--font-sans)"
                  }}
                  onMouseEnter={e => { if (!submitted) e.currentTarget.style.background = "var(--paper-2)"; }}
                  onMouseLeave={e => { if (!submitted) e.currentTarget.style.background = "var(--paper)"; }}
                >
                  {(submitted || revealed) && (
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: revealed ? "var(--sage-bg)" : "var(--ochre-bg)", transition: "width 0.8s cubic-bezier(.2,.7,.3,1)" }} />
                  )}
                  <div className="flex items-center gap-3" style={{ position: "relative" }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: q.multi ? 3 : "50%",
                      border: `1.5px solid ${picked ? "var(--ink)" : "var(--rule-2)"}`,
                      background: picked ? "var(--ink)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: "var(--paper)"
                    }}>
                      {picked && (q.multi ? <Icon name="check" size={11} stroke={3} /> : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--paper)" }} />)}
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5 }}>{o.label}</span>
                    {(submitted || revealed) && <span className="mono text-xs" style={{ color: "var(--ink-2)", fontWeight: 600 }}>{pct}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <textarea
            className="textarea"
            rows={4}
            disabled={submitted}
            value={submitted ? myAnswer.text : openText}
            onChange={e => setOpenText(e.target.value)}
            placeholder={q.placeholder || "Your thoughts"}
          />
        )}

        <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
          <div className="mono text-xs dim">
            {submitted
              ? (revealed ? `Results released  -  ${respCount} responses` : `Submitted  -  waiting for instructor to release results`)
              : `${respCount} / ${attendance} answered`}
          </div>
          {!submitted && (
            <Btn variant="ochre" size="sm" icon="send"
              disabled={q.kind === "poll" ? selected.length === 0 : !openText.trim()}
              onClick={submit}>Submit</Btn>
          )}
          {submitted && !revealed && (
            <Chip icon="clock">Awaiting release</Chip>
          )}
          {revealed && (
            <Chip tone="sage" icon="check">Results in</Chip>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== AGENT PANEL =====
const AgentPanel = ({ onClose, caseData }) => {
  const c = caseData;
  const [messages, setMessages] = useStateS([
    {
      role: "agent",
      text: `Hi  -  I'm the case agent for "${c.title}". I've read the two-pager, the sources, and the exhibits. Ask me anything  -  concepts, framework refreshers, quotes from the case. I won't give you the "right answer" to any live poll.`
    }
  ]);
  const [input, setInput] = useStateS("");
  const [thinking, setThinking] = useStateS(false);
  const listRef = useRefS(null);

  useEffectS(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking]);

  const send = async (overrideText) => {
    const text = overrideText ?? input.trim();
    if (!text || thinking) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setThinking(true);

    const systemPrompt = `You are the AI case agent for a business school classroom platform called LiveCase.ai. The case is:

TITLE: ${c.title}
SUBTITLE: ${c.subtitle}
SUBJECT: ${c.subject}
FRAMEWORKS IN USE: ${c.frameworks.join(", ")}

FULL CASE TEXT:
${c.sections.map(s => s.heading + "\n" + s.body).join("\n\n")}

SOURCES CITED: ${c.sources.map(s => s.label).join("; ")}

RULES:
- You are a Socratic tutor. Help the student REASON, do not give them "the answer" to any discussion question.
- If asked about a framework, explain it in 2-3 tight sentences with a one-line example from THIS case.
- If asked for a fact from the case, answer crisply and cite the section heading.
- If asked to pick a side of the dilemma, refuse politely and turn the question back on them.
- Keep responses under 120 words. Use plain text, no markdown headings.
- Tone: warm, academic, confident. Like a TA, not a lecturer.`;

    try {
      const reply = await window.claude.complete({
        messages: [
          { role: "user", content: systemPrompt + "\n\n---\n\nStudent question: " + text }
        ]
      });
      setMessages(m => [...m, { role: "agent", text: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: "agent", text: "I hit a snag reaching the model. Try again?" }]);
    } finally {
      setThinking(false);
    }
  };

  const suggestions = [
    "Refresh me on Porter's Five Forces",
    "What's the CFO's main objection?",
    "Why would the horizontal platforms move downmarket?"
  ];

  return (
    <div style={{ borderLeft: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper)" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkles" size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Case agent</div>
            <div className="mono dim text-xs">Knows this case  -  not a judge</div>
          </div>
        </div>
        <button onClick={onClose} className="btn ghost sm" style={{ padding: 6 }}><Icon name="x" size={12} /></button>
      </div>

      <div ref={listRef} style={{ flex: 1, overflow: "auto", padding: "18px" }}>
        <div className="flex col gap-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {thinking && (
            <div className="flex items-center gap-2" style={{ paddingLeft: 4 }}>
              <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)" }} />
              <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", animationDelay: "0.2s" }} />
              <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-3)", animationDelay: "0.4s" }} />
              <span className="mono text-xs dim" style={{ marginLeft: 4 }}>thinking</span>
            </div>
          )}
        </div>

        {messages.length <= 1 && !thinking && (
          <div style={{ marginTop: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Try</div>
            <div className="flex col gap-1.5" style={{ gap: 6 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)} className="btn ghost sm" style={{ justifyContent: "flex-start", width: "100%", padding: "8px 10px", fontSize: 12, color: "var(--ink-2)" }}>
                  <Icon name="sparkles" size={11} style={{ color: "var(--ochre)" }} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 14px 16px", borderTop: "1px solid var(--rule)", background: "var(--paper)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "6px 8px", border: "1px solid var(--rule-2)", borderRadius: 4, background: "var(--paper)" }}>
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about concepts, facts from the case"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", resize: "none", fontFamily: "var(--font-sans)", fontSize: 13, padding: 6, color: "var(--ink)", lineHeight: 1.4, maxHeight: 120 }}
          />
          <button onClick={() => send()} disabled={!input.trim() || thinking} className="btn ochre sm" style={{ padding: 8, opacity: input.trim() ? 1 : 0.5 }}>
            <Icon name="send" size={12} />
          </button>
        </div>
        <div className="mono dim" style={{ fontSize: 10, marginTop: 6, textAlign: "center", lineHeight: 1.4 }}>
          The agent won't answer live polls for you.
        </div>
      </div>
    </div>
  );
};

const Bubble = ({ role, text }) => {
  if (role === "user") {
    return (
      <div style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
        <div style={{ padding: "10px 14px", background: "var(--ink)", color: "var(--paper)", borderRadius: "14px 14px 3px 14px", fontSize: 13, lineHeight: 1.5 }}>
          {text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--ochre-bg)", color: "var(--ochre-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--ochre)" }}>
        <Icon name="sparkles" size={11} />
      </div>
      <div style={{ padding: "10px 14px", background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: "14px 14px 14px 3px", fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: "88%", whiteSpace: "pre-wrap", textWrap: "pretty" }}>
        {text}
      </div>
    </div>
  );
};

// ===== STUDENT ROOT =====
const StudentView = ({ stage, setStage, studentName, setStudentName, sessionState, dispatch, studentId, caseData }) => {
  const sessionId = useMemoS(() => getSessionId(), []);
  const socket = window.socket;

  const handleJoin = (name) => {
    const normalized = name?.trim() || "Guest";
    if (!sessionId) {
      console.warn("Missing session_id in URL query string");
      return;
    }
    socket?.emit("join_session", {
      session_id: sessionId,
      user_id: studentId,
      name: normalized,
      role: "student"
    });
    setStudentName(normalized);
    setStage("read");
  };

  if (stage === "join") return <StudentJoin caseData={caseData} onJoin={handleJoin} />;
  if (stage === "read") return <StudentReader caseData={caseData} studentName={studentName} onConfirmRead={() => setStage("discuss")} />;
  if (stage === "discuss") return <StudentDiscussion caseData={caseData} studentName={studentName} studentId={studentId} sessionState={sessionState} dispatch={dispatch} sessionId={sessionId} />;
  return null;
};

Object.assign(window, { StudentView });


