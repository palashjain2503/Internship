// Main app  -  shell, state, faculty/student split, tweaks
const { useState: useStateA, useEffect: useEffectA, useReducer: useReducerA, useRef: useRefA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "warm",
  "split": "both"
}/*EDITMODE-END*/;

const apiFetch = async (path, options = {}) => {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
};

const normalizeCaseDoc = (caseDoc, fallback = {}) => ({
  title: caseDoc.title || fallback.title || "Untitled case",
  subtitle: caseDoc.subtitle || fallback.subtitle || "",
  subject: caseDoc.subject || fallback.subject || "",
  course: caseDoc.course || fallback.course || "",
  instructor: caseDoc.instructor || fallback.instructor || "",
  readingTime: caseDoc.reading_time || fallback.readingTime || "",
  wordCount: caseDoc.word_count || fallback.wordCount || 0,
  generatedAt: caseDoc.generated_at || fallback.generatedAt || "",
  frameworks: caseDoc.frameworks || fallback.frameworks || [],
  sections: caseDoc.sections || fallback.sections || [],
  exhibits: caseDoc.exhibits || fallback.exhibits || [],
  sources: caseDoc.sources || fallback.sources || []
});

// ===== SESSION REDUCER (shared state between faculty + student) =====
const initialSession = () => ({
  attendance: 18,
  questions: window.SEED_QUESTIONS.map(q => ({ ...q })),
  answers: {}, // qid -> array of {studentId, choices?, text?, avatar, color}
  results: {}, // qid -> { optionId: count }
  activeQuestionId: null,
});

function sessionReducer(state, action) {
  switch (action.type) {
    case "pushLive": {
      return {
        ...state,
        activeQuestionId: action.id,
        questions: state.questions.map(q => q.id === action.id ? { ...q, status: "live" } : q)
      };
    }
    case "reveal": {
      return {
        ...state,
        questions: state.questions.map(q => q.id === action.id ? { ...q, status: "revealed" } : q)
      };
    }
    case "addQuestion": {
      const normalizedStatus = (action.q.status || "live").toLowerCase();
      const existing = state.questions.find(q => q.id === action.q.id);
      return {
        ...state,
        questions: existing
          ? state.questions.map(q => q.id === action.q.id ? { ...q, ...action.q, status: normalizedStatus } : q)
          : [...state.questions, { ...action.q, status: normalizedStatus }],
        activeQuestionId: action.q.id
      };
    }
    case "answer": {
      const { qid, answer } = action;
      const student = window.SEED_ROSTER.find(s => s.id === answer.studentId) || { avatar: "", color: "var(--ink-3)" };
      const enriched = { ...answer, avatar: student.avatar, color: student.color };
      const existing = state.answers[qid] || [];
      // replace existing answer from same student
      const filtered = existing.filter(a => a.studentId !== answer.studentId);
      const nextAnswers = { ...state.answers, [qid]: [...filtered, enriched] };

      // recompute results for polls
      const q = state.questions.find(x => x.id === qid);
      const nextResults = { ...state.results };
      if (q && q.kind === "poll") {
        const tally = {};
        (nextAnswers[qid] || []).forEach(a => {
          (a.choices || []).forEach(c => { tally[c] = (tally[c] || 0) + 1; });
        });
        nextResults[qid] = tally;
      }
      return { ...state, answers: nextAnswers, results: nextResults };
    }
    case "simulateAnswers": {
      // fill in fake classmates' responses
      const q = state.questions.find(x => x.id === action.qid);
      if (!q) return state;
      const existing = state.answers[action.qid] || [];
      const existingIds = new Set(existing.map(a => a.studentId));
      const available = window.SEED_ROSTER.filter(s => !existingIds.has(s.id) && s.id !== "s1").slice(0, action.count || 8);
      const newAns = available.map((s, i) => {
        if (q.kind === "poll") {
          // distribution biased to option C (hybrid)
          const weights = { a: 3, b: 2, c: 5, d: 1 };
          const total = Object.values(weights).reduce((a, b) => a + b, 0);
          let r = Math.random() * total;
          let pick = "a";
          for (const [k, w] of Object.entries(weights)) {
            if ((r -= w) < 0) { pick = k; break; }
          }
          return { studentId: s.id, choices: [pick], avatar: s.avatar, color: s.color };
        } else {
          const samples = [
            "Threatened: Supplier power (platform locks in data providers). Rivalry (horizontal entrants). Improved: Buyer power shrinks as switching costs rise.",
            "Threatened: Rivalry intensifies from horizontal platforms. Threat of substitutes grows. Improved: Buyer switching costs increase once agents are embedded.",
            "Threatened: New entrants (low-cost vertical agents). Supplier power (data vendors). Improved: Bargaining power over buyers via workflow lock-in.",
            "Threatened: Substitutes  -  customers build their own. Buyer power  -  they already are. Improved: Entry barriers rise as the platform compounds."
          ];
          return { studentId: s.id, text: samples[i % samples.length], avatar: s.avatar, color: s.color };
        }
      });
      const nextAnswers = { ...state.answers, [action.qid]: [...existing, ...newAns] };
      const nextResults = { ...state.results };
      if (q.kind === "poll") {
        const tally = {};
        nextAnswers[action.qid].forEach(a => (a.choices || []).forEach(c => tally[c] = (tally[c] || 0) + 1));
        nextResults[action.qid] = tally;
      }
      return { ...state, answers: nextAnswers, results: nextResults };
    }
    case "setSessionSnapshot": {
      const questions = (action.session?.questions || []).map(q => ({
        id: q.question_id || q.id,
        question_id: q.question_id || q.id,
        kind: q.kind,
        prompt: q.prompt,
        options: q.options || [],
        multi: q.multi_select || q.multi,
        status: (q.status || "draft").toLowerCase()
      }));
      return {
        ...state,
        attendance: action.session?.participant_count || state.attendance,
        questions,
        activeQuestionId: action.currentQuestion?.question_id || state.activeQuestionId
      };
    }
    case "userJoined":
      return { ...state, attendance: action.participant_count || state.attendance };
    case "setResults":
      return { ...state, results: { ...state.results, [action.qid]: action.results } };
    case "updateQuestionStatus":
      return {
        ...state,
        questions: state.questions.map(q => q.id === action.qid ? { ...q, status: action.status } : q)
      };
    default: return state;
  }
}

// Auto-simulate classmate answers when a question goes live
function useAutoSimulate(state, dispatch) {
  const seenRef = useRefA({});
  useEffectA(() => {
    const liveQ = state.questions.find(q => q.id === state.activeQuestionId && q.status === "live");
    if (!liveQ) return;
    if (seenRef.current[liveQ.id]) return;
    seenRef.current[liveQ.id] = true;

    const timers = [];
    [1500, 3000, 4500, 6500, 9000].forEach((delay, i) => {
      timers.push(setTimeout(() => dispatch({ type: "simulateAnswers", qid: liveQ.id, count: 2 + i }), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [state.activeQuestionId, state.questions]);
}

// ===== TWEAKS PANEL =====
const TweaksPanel = ({ visible, theme, setTheme, split, setSplit, onReset }) => {
  if (!visible) return null;
  const themes = [
    { value: "warm", label: "Warm academic", sw1: "#f5efe4", sw2: "#c4a676" },
    { value: "sage", label: "Sage study", sw1: "#eef0e6", sw2: "#a6b187" },
    { value: "ink", label: "Ink (dark)", sw1: "#16130e", sw2: "#ddd3bd" },
    { value: "rose", label: "Rose folio", sw1: "#f5ece6", sw2: "#c1a48c" }
  ];
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 100,
      width: 260, background: "var(--paper)", border: "1px solid var(--ink)",
      borderRadius: 6, boxShadow: "var(--shadow-lg)", padding: 16, fontFamily: "var(--font-sans)"
    }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>Tweaks</div>
        <button onClick={onReset} className="mono text-xs" style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", textDecoration: "underline" }}>Reset</button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Color theme</div>
        <div className="flex col gap-1.5" style={{ gap: 5 }}>
          {themes.map(t => (
            <button key={t.value} onClick={() => setTheme(t.value)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
              border: `1px solid ${theme === t.value ? "var(--ink)" : "var(--rule)"}`,
              background: theme === t.value ? "var(--paper-2)" : "var(--paper)",
              borderRadius: 3, cursor: "pointer", textAlign: "left", width: "100%"
            }}>
              <div style={{ display: "flex", gap: 3 }}>
                <div style={{ width: 14, height: 14, background: t.sw1, border: "1px solid var(--rule)", borderRadius: 2 }} />
                <div style={{ width: 14, height: 14, background: t.sw2, border: "1px solid var(--rule)", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, flex: 1, color: "var(--ink)" }}>{t.label}</span>
              {theme === t.value && <Icon name="check" size={12} stroke={3} style={{ color: "var(--ink)" }} />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>View split</div>
        <Segmented
          value={split} onChange={setSplit} size="sm"
          options={[
            { value: "faculty", label: "Faculty" },
            { value: "both", label: "Both" },
            { value: "student", label: "Student" }
          ]}
        />
      </div>
    </div>
  );
};

// ===== TOP BAR =====
const TopBar = ({ split, setSplit, stage, facultyStage, setFacultyStage, onReset }) => (
  <div style={{
    padding: "10px 20px", borderBottom: "1px solid var(--rule)",
    background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0
  }}>
    <div className="flex items-center gap-4">
      <Logo size={20} />
      <div style={{ width: 1, height: 20, background: "var(--rule)" }} />
      <Segmented
        value={split} onChange={setSplit} size="sm"
        options={[
          { value: "faculty", label: "Faculty", icon: "edit" },
          { value: "both", label: "Split", icon: "mon" },
          { value: "student", label: "Student", icon: "book" }
        ]}
      />
    </div>
    <div className="flex items-center gap-3">
      <span className="mono text-xs dim">Prototype  -  interactive</span>
      <button onClick={onReset} className="btn ghost sm"><Icon name="x" size={11} /> Restart demo</button>
    </div>
  </div>
);

// ===== FACULTY STAGE CRUMB =====
const FacultyStageCrumb = ({ stage, setStage }) => {
  const steps = [
    { id: "create", label: "Compose" },
    { id: "generating", label: "Generate" },
    { id: "preview", label: "Preview" },
    { id: "share", label: "Share" },
    { id: "live", label: "Live" }
  ];
  const idx = steps.findIndex(s => s.id === stage);
  return (
    <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <React.Fragment key={s.id}>
            <button onClick={() => setStage(s.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 11, fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: active ? "var(--ink)" : done ? "var(--ink-3)" : "var(--ink-4)",
              fontWeight: active ? 700 : 500,
              padding: "2px 6px"
            }}>
              <span className="mono" style={{ marginRight: 6, color: "var(--ink-4)" }}>{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
            {i < steps.length - 1 && <Icon name="chevR" size={10} style={{ color: "var(--ink-4)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ===== STUDENT STAGE CRUMB =====
const StudentStageCrumb = ({ stage, setStage }) => {
  const steps = [
    { id: "join", label: "Join" },
    { id: "read", label: "Read" },
    { id: "discuss", label: "Discuss" }
  ];
  const idx = steps.findIndex(s => s.id === stage);
  return (
    <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <React.Fragment key={s.id}>
            <button onClick={() => setStage(s.id)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontSize: 11, fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: active ? "var(--ink)" : done ? "var(--ink-3)" : "var(--ink-4)",
              fontWeight: active ? 700 : 500,
              padding: "2px 6px"
            }}>
              <span className="mono" style={{ marginRight: 6, color: "var(--ink-4)" }}>{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </button>
            {i < steps.length - 1 && <Icon name="chevR" size={10} style={{ color: "var(--ink-4)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ===== PANE WRAPPER =====
const Pane = ({ title, subtitle, icon, children, crumb }) => (
  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, background: "var(--paper)", position: "relative", overflow: "hidden" }}>
    <div style={{ padding: "8px 20px", background: "var(--ink)", color: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
      <div className="flex items-center gap-2">
        <Icon name={icon} size={13} />
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>{title}</span>
        <span style={{ opacity: 0.6, fontSize: 11 }}>{subtitle}</span>
      </div>
    </div>
    {crumb}
    <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {children}
    </div>
  </div>
);

// ===== APP =====
const App = () => {
  const [caseData, setCaseData] = useStateA(window.CASE_DATA);
  const persisted = JSON.parse(localStorage.getItem("livecase-tweaks") || "null") || TWEAK_DEFAULTS;
  const persistedStage = JSON.parse(localStorage.getItem("livecase-stage") || "null");

  const [theme, setThemeRaw] = useStateA(persisted.theme);
  const [split, setSplitRaw] = useStateA(persisted.split);
  const [tweaksOn, setTweaksOn] = useStateA(false);

  const [facultyStage, setFacultyStage] = useStateA(persistedStage?.faculty || "create");
  const [studentStage, setStudentStage] = useStateA(persistedStage?.student || "join");

  const [draft, setDraft] = useStateA({
    title: "",
    subject: "",
    course: "",
    links: [""],
    dilemma: "",
    options: "",
    files: [],
    frameworks: [],
    pages: 2
  });

  const [sessionState, dispatch] = useReducerA(sessionReducer, null, initialSession);
  useAutoSimulate(sessionState, dispatch);

  const [socket, setSocket] = useStateA(null);
  const [socketConnected, setSocketConnected] = useStateA(false);

  const studentId = "s1";
  const [studentName, setStudentName] = useStateA("Aarav K.");
  const [generateError, setGenerateError] = useStateA("");
  const [generateReady, setGenerateReady] = useStateA(false);
  const [generateLogs, setGenerateLogs] = useStateA([]);

  // apply theme
  useEffectA(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  // persist tweaks
  useEffectA(() => { localStorage.setItem("livecase-tweaks", JSON.stringify({ theme, split })); }, [theme, split]);
  useEffectA(() => { localStorage.setItem("livecase-stage", JSON.stringify({ faculty: facultyStage, student: studentStage })); }, [facultyStage, studentStage]);
  useEffectA(() => { window.CASE_DATA = caseData; }, [caseData]);

  const setTheme = v => { setThemeRaw(v); window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { theme: v } }, "*"); };
  const setSplit = v => { setSplitRaw(v); window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { split: v } }, "*"); };

  useEffectA(() => {
    if (window.socket) {
      setSocket(window.socket);
      setSocketConnected(window.socket.connected);
      return;
    }

    if (typeof window.io !== "function") {
      console.warn("Socket.IO client not available on window.io");
      return;
    }

    const sock = window.io({ path: "/socket.io", transports: ["websocket"] });
    window.socket = sock;
    setSocket(sock);

    sock.on("connect", () => {
      setSocketConnected(true);
      console.info("socket connected", sock.id);
    });

    sock.on("disconnect", () => {
      setSocketConnected(false);
      console.info("socket disconnected");
    });

    sock.on("session_snapshot", ({ session, current_question }) => {
      dispatch({ type: "setSessionSnapshot", session, currentQuestion: current_question });
    });

    sock.on("user_joined", ({ participant_count }) => {
      dispatch({ type: "userJoined", participant_count });
    });

    sock.on("new_question", ({ question }) => {
      dispatch({
        type: "addQuestion",
        q: {
          ...question,
          id: question.question_id || question.id,
          multi: question.multi_select || question.multi,
          status: (question.status || "live").toLowerCase()
        }
      });
    });

    sock.on("answer_received", ({ question_id, distribution }) => {
      dispatch({ type: "setResults", qid: question_id, results: distribution || {} });
    });

    sock.on("question_locked", ({ question_id }) => {
      dispatch({ type: "updateQuestionStatus", qid: question_id, status: "locked" });
    });

    sock.on("results_revealed", ({ question_id, results }) => {
      dispatch({ type: "updateQuestionStatus", qid: question_id, status: "revealed" });
      dispatch({ type: "setResults", qid: question_id, results: results.distribution || results || {} });
    });

    sock.on("session_ended", (payload) => {
      console.info("session_ended", payload);
    });

    sock.on("error", (payload) => {
      console.warn("socket error", payload);
    });

    return () => {
      sock.off("connect");
      sock.off("disconnect");
      sock.off("session_snapshot");
      sock.off("user_joined");
      sock.off("new_question");
      sock.off("answer_received");
      sock.off("question_locked");
      sock.off("results_revealed");
      sock.off("session_ended");
      sock.off("error");
      sock.disconnect();
    };
  }, [dispatch]);

  // When faculty pushes live, auto-advance student to discuss
  useEffectA(() => {
    if (sessionState.activeQuestionId && studentStage === "read") {
      setStudentStage("discuss");
    }
  }, [sessionState.activeQuestionId, studentStage, setStudentStage]);

  // Edit mode bridge
  useEffectA(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setTweaksOn(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOn(false);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", handler);
  }, []);

  const reset = () => {
    localStorage.removeItem("livecase-stage");
    setFacultyStage("create");
    setStudentStage("join");
    window.location.reload();
  };
    const handleGenerateCase = async () => {
      setGenerateError("");
      setGenerateReady(false);
      setGenerateLogs([]);
      setFacultyStage("generating");
      try {
        const draftPayload = {
          ...draft,
          instructor: caseData.instructor
        };
        const created = await apiFetch("/api/cases", {
          method: "POST",
          body: JSON.stringify(draftPayload)
        });
        const generated = await apiFetch(`/api/cases/${created.id}/generate`, {
          method: "POST"
        });
        const nextCase = normalizeCaseDoc(generated.case, caseData);
        setCaseData(nextCase);
        setGenerateLogs(generated.logs || []);
        setGenerateReady(true);
      } catch (err) {
        setGenerateError(err.message || "Failed to generate case. Check the backend logs.");
        setFacultyStage("create");
      }
    };

    const handleOpenDraft = () => {
      if (generateReady) setFacultyStage("preview");
    };
  const resetTweaks = () => { setTheme("warm"); setSplit("both"); };

  const showFaculty = split === "faculty" || split === "both";
  const showStudent = split === "student" || split === "both";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <TopBar split={split} setSplit={setSplit} onReset={reset} />
      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: showFaculty && showStudent ? "1fr 1fr" : "1fr",
        borderTop: "1px solid var(--rule)",
        minHeight: 0,
        background: "var(--paper-3)"
      }}>
        {showFaculty && (
          <Pane
            title="Faculty" subtitle=" -  Prof. Ananya Rao"
            icon="edit"
            crumb={<FacultyStageCrumb stage={facultyStage} setStage={setFacultyStage} />}
          >
            <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
              <FacultyView
                stage={facultyStage}
                setStage={setFacultyStage}
                onGenerateCase={handleGenerateCase}
                onOpenDraft={handleOpenDraft}
                generateError={generateError}
                generateReady={generateReady}
                generateLogs={generateLogs}
                caseData={caseData}
                draft={draft} setDraft={setDraft}
                sessionState={sessionState}
                dispatch={dispatch}
              />
            </div>
          </Pane>
        )}
        {showStudent && (
          <Pane
            title="Student" subtitle={` -  ${studentName || "Anonymous"}`}
            icon="book"
            crumb={<StudentStageCrumb stage={studentStage} setStage={setStudentStage} />}
          >
            <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <StudentView
                stage={studentStage}
                setStage={setStudentStage}
                studentName={studentName}
                setStudentName={setStudentName}
                caseData={caseData}
                sessionState={sessionState}
                dispatch={dispatch}
                studentId={studentId}
              />
            </div>
          </Pane>
        )}
      </div>

      <TweaksPanel visible={tweaksOn} theme={theme} setTheme={setTheme} split={split} setSplit={setSplit} onReset={resetTweaks} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

