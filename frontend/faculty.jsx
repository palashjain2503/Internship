// Faculty view  -  create case, generating, preview, live control
const { useState: useStateF, useEffect: useEffectF, useRef: useRefF, useMemo: useMemoF } = React;

// ===== CREATE CASE FORM =====
const CreateCase = ({ onGenerate, draft, setDraft, error }) => {
  const addLink = () => setDraft({ ...draft, links: [...draft.links, ""] });
  const setLink = (i, v) => { const next = draft.links.slice(); next[i] = v; setDraft({ ...draft, links: next }); };
  const removeLink = (i) => { const next = draft.links.filter((_, idx) => idx !== i); setDraft({ ...draft, links: next }); };
  const toggleFramework = (f) => {
    const has = draft.frameworks.includes(f);
    const next = has ? draft.frameworks.filter(x => x !== f) : [...draft.frameworks, f];
    setDraft({ ...draft, frameworks: next });
  };
  const complete = true;

  const FRAMEWORKS = ["Porter's Five Forces", "Platform vs. Pipeline", "Jobs-to-be-Done", "SWOT", "Blue Ocean", "Value Chain", "BCG Matrix", "Disruption Theory"];
  const SUBJECTS = ["Technology & Strategy", "Marketing", "Finance", "Operations", "Leadership"];

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 40px 80px" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>New Case  -  Draft</div>
      <h1 className="serif" style={{ fontSize: 40, margin: "0 0 8px", fontWeight: 500, letterSpacing: "-0.02em" }}>
        Compose a case
      </h1>
      <p style={{ color: "var(--ink-3)", fontSize: 15, margin: "0 0 40px", maxWidth: 560, lineHeight: 1.55 }}>
        Drop in the raw material  -  articles, the dilemma, a few docs. LiveCase drafts a two-pager in your voice, which you can edit before sharing.
      </p>

      <div className="flex col gap-6">
        <div className="card" style={{ padding: 16, background: "var(--paper-2)" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Teaching goal</div>
            <div className="mono dim" style={{ fontSize: 10 }}>Optional</div>
          </div>
          <input className="input" placeholder="e.g. Platform governance tradeoffs" />
        </div>

        <Field label="Case title">
          <input className="input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Helion Labs: Betting the farm on agents" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Field label="Subject">
            <select className="select" value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Course code">
            <input className="input" value={draft.course} onChange={e => setDraft({ ...draft, course: e.target.value })}
              placeholder="STR-621  -  Platform Strategy" />
          </Field>
        </div>

        <Field label="News & article links"
          hint="Paste 1-3 articles. LiveCase reads them and distills the situation.">
          <div className="flex col gap-2">
            {draft.links.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <div style={{ display: "flex", alignItems: "center", padding: "0 10px", border: "1px solid var(--rule-2)", borderRadius: 3, background: "var(--paper)", flex: 1 }}>
                  <Icon name="link" size={13} style={{ color: "var(--ink-3)" }} />
                  <input
                    value={l}
                    onChange={e => setLink(i, e.target.value)}
                    placeholder="https://..."
                    style={{ flex: 1, border: "none", background: "transparent", padding: "10px 8px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", outline: "none" }}
                  />
                </div>
                <button onClick={() => removeLink(i)} style={{ background: "transparent", border: "none", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            <button onClick={addLink} className="btn ghost sm" style={{ alignSelf: "flex-start" }}>
              <Icon name="plus" size={12} /> Add link
            </button>
          </div>
        </Field>

        <Field label="The dilemma"
          hint="What's the decision on the table? Plain language is fine.">
          <textarea className="textarea" rows={5} value={draft.dilemma} onChange={e => setDraft({ ...draft, dilemma: e.target.value })}
            placeholder="Helion must decide by Monday whether to open its platform to third-party agents, ship first-party agents only, or stay the course" />
        </Field>

        <Field label="Options students should weigh" hint="One per line. LiveCase will expand each into a short paragraph.">
          <textarea className="textarea" rows={4} value={draft.options} onChange={e => setDraft({ ...draft, options: e.target.value })}
            placeholder={"Open platform\nFirst-party agents only\nHybrid\nStay the course"} />
        </Field>

        <Field label="Supporting documents" hint="PDFs, slide decks, memos. Optional.">
          <Dropzone files={draft.files} onChange={files => setDraft({ ...draft, files })} />
        </Field>

        <Field label="Frameworks to teach" hint="We weave these into the case without naming them bluntly.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FRAMEWORKS.map(f => (
              <button
                key={f}
                onClick={() => toggleFramework(f)}
                className={`btn ghost sm ${draft.frameworks.includes(f) ? "focus-ring" : ""}`}
                style={{ borderColor: draft.frameworks.includes(f) ? "var(--ink)" : "var(--rule-2)" }}
              >
                {draft.frameworks.includes(f) ? "" : ""} {f}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Target length">
          <Segmented
            options={[
              { value: 1, label: "1 page  -  5 min read" },
              { value: 2, label: "2 pages  -  7 min read" },
              { value: 3, label: "3 pages  -  10 min read" }
            ]}
            value={draft.pages}
            onChange={v => setDraft({ ...draft, pages: v })}
          />
        </Field>

        {error && (
          <div className="card" style={{ padding: 12, borderColor: "var(--terra)", background: "var(--paper-2)", color: "var(--terra)" }}>
            <div className="mono text-xs">Generation failed</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{error}</div>
          </div>
        )}

        <div className="rule" style={{ margin: "12px 0" }} />

        <div className="flex items-center justify-between">
          <div className="mono text-xs dim">Auto-saved just now</div>
          <div className="flex items-center gap-3">
            <Btn variant="ghost">Save draft</Btn>
            <Btn variant="ochre" icon="sparkles" disabled={!complete} onClick={onGenerate}>
              Generate case
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, hint, required, children }) => (
  <div className="flex col gap-2">
    <div className="flex items-center justify-between">
      <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", color: "var(--ink-2)" }}>
        {label}
        {required && <span style={{ color: "var(--terra)", marginLeft: 4 }}>*</span>}
      </label>
      {hint && <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{hint}</span>}
    </div>
    {children}
  </div>
);

const Dropzone = ({ files, onChange }) => {
  const [hover, setHover] = useStateF(false);
  const inputRef = useRefF(null);
  const onPick = async (event) => {
    const fileList = Array.from(event.target.files || []);
    const picked = await Promise.all(fileList.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buf = new Uint8Array(reader.result || []);
        resolve({
          name: file.name,
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          content: Array.from(buf)
        });
      };
      reader.readAsArrayBuffer(file);
    })));
    onChange([...files, ...picked]);
    event.target.value = "";
  };
  const remove = (i) => onChange(files.filter((_, idx) => idx !== i));
  return (
    <div>
      <div
        onClick={() => inputRef.current && inputRef.current.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: `1.5px dashed ${hover ? "var(--ochre)" : "var(--rule-2)"}`,
          borderRadius: 4,
          padding: "24px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: hover ? "var(--ochre-bg)" : "transparent",
          transition: "all 0.15s"
        }}>
        <Icon name="upload" size={20} style={{ color: "var(--ink-3)" }} />
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Drop files, or <span style={{ color: "var(--ochre-ink)", fontWeight: 600 }}>browse</span>
        </div>
        <div className="mono dim" style={{ fontSize: 10, marginTop: 4 }}>PDF  -  DOCX  -  XLSX  -  up to 20 MB</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={onPick}
      />
      {files.length > 0 && (
        <div className="flex col gap-2" style={{ marginTop: 10 }}>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: "8px 12px", background: "var(--paper-2)", border: "1px solid var(--rule)", borderRadius: 3 }}>
              <Icon name="file" size={14} style={{ color: "var(--ink-3)" }} />
              <span style={{ flex: 1, fontSize: 13 }}>{f.name}</span>
              <span className="mono dim text-xs">{f.size}</span>
              <button onClick={() => remove(i)} style={{ background: "transparent", border: "none", color: "var(--ink-4)", cursor: "pointer" }}>
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== GENERATING (loading) =====
const Generating = ({ onDone, draft, isReady, logs }) => {
  const [step, setStep] = useStateF(0);
  const steps = [
    { label: "Reading sources", detail: `${draft.links.filter(l=>l.trim()).length} article${draft.links.filter(l=>l.trim()).length===1?"":"s"}` },
    { label: "Mapping the dilemma", detail: "Identifying decision, constraints, stakeholders" },
    { label: "Weaving frameworks", detail: draft.frameworks.slice(0, 2).join("  -  ") || "General analysis" },
    { label: "Drafting the two-pager", detail: `~${draft.pages * 550} words` },
    { label: "Generating discussion prompts", detail: "1 poll  -  1 open-ended" }
  ];
  const logSet = new Set(logs || []);
  const completedCount = [
    logSet.has("fetch_sources: fetched 0 sources") || logSet.has("fetch_sources: fetched 1 sources") || logSet.has("fetch_sources: fetched 2 sources") || logSet.has("fetch_sources: fetched 3 sources") || logSet.has("fetch_sources: fetched 4 sources"),
    logSet.has("analyze: created brief"),
    logSet.has("draft: generated case JSON"),
    logSet.has("finalize: computed metadata")
  ].filter(Boolean).length;
  useEffectF(() => {
    if (isReady) return;
    if (step >= steps.length - 1) return;
    const t = setTimeout(() => setStep(step + 1), 900);
    return () => clearTimeout(t);
  }, [step, isReady]);

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "80px 40px" }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 40 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "2px solid var(--rule)",
          borderTopColor: "var(--ochre)",
          animation: "spin 1.1s linear infinite"
        }} />
        <div>
          <div className="eyebrow">Generating</div>
          <div className="serif" style={{ fontSize: 24, marginTop: 2 }}>{draft.title || "Untitled case"}</div>
        </div>
      </div>

      <div className="flex col gap-1">
        {steps.map((s, i) => {
          const done = isReady || i <= step || (i < completedCount + 1);
          return (
            <div key={i} className="card" style={{ padding: 12, borderColor: done ? "var(--ochre)" : "var(--rule)", background: done ? "var(--ochre-bg)" : "var(--paper)" }}>
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 500 }}>{s.label}</div>
              {done && <Icon name="check" size={12} />}
            </div>
            <div className="mono dim" style={{ fontSize: 10, marginTop: 3 }}>{s.detail}</div>
          </div>
        );
        })}
      </div>

      {isReady && (
        <div style={{ marginTop: 18 }}>
          <Btn variant="ochre" icon="arrR" onClick={onDone}>Open draft</Btn>
        </div>
      )}
    </div>
  );
};

// ===== PREVIEW / EDIT =====
const CasePreview = ({ onPublish, onBack, caseData }) => {
  const c = caseData;
  const downloadDoc = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${c.title}</title></head><body>`
      + `<h1>${c.title}</h1>`
      + `<p><em>${c.subtitle || ""}</em></p>`
      + `<p>${c.course || ""} ${c.subject ? "- " + c.subject : ""}</p>`
      + (c.sections || []).map(s => `<h2>${s.heading}</h2><p>${s.body}</p>`).join("")
      + `</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(c.title || "case").replace(/\s+/g, "-").toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const [mode, setMode] = useStateF("read"); // read | edit
  return (
    <div style={{ padding: "20px 32px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn ghost sm"><Icon name="chevL" size={12} /> Back</button>
          <Chip icon="check" tone="sage">Draft ready</Chip>
          <span className="mono dim text-xs">{c.generatedAt}</span>
        </div>
        <div className="flex items-center gap-2">
          <Segmented value={mode} onChange={setMode} size="sm" options={[
            { value: "read", label: "Read", icon: "eye" },
            { value: "edit", label: "Edit", icon: "edit" }
          ]} />
          <div style={{ width: 1, height: 24, background: "var(--rule)", margin: "0 6px" }} />
          <Btn variant="ghost" size="sm" icon="download" onClick={downloadDoc}>Word doc</Btn>
          <Btn variant="ochre" size="sm" icon="share" onClick={onPublish}>Publish & share</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div className="doc" style={{ padding: "56px 72px 64px" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{c.course}  -  {c.subject}</div>
          <h1 className="serif" style={{ fontSize: 34, fontWeight: 500, margin: "0 0 10px", letterSpacing: "-0.015em", lineHeight: 1.15, outline: "none" }}
            contentEditable={mode === "edit"} suppressContentEditableWarning>
            {c.title}
          </h1>
          <p className="serif" style={{ fontSize: 17, color: "var(--ink-2)", fontStyle: "italic", margin: "0 0 24px", lineHeight: 1.4 }}>
            {c.subtitle}
          </p>
          <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
            <span className="mono dim text-xs">{c.instructor}</span>
            <span className="dim"> - </span>
            <span className="mono dim text-xs">{c.readingTime}</span>
            <span className="dim"> - </span>
            <span className="mono dim text-xs">{c.wordCount} words</span>
          </div>

          <div className="rule" style={{ marginBottom: 24 }} />

          {c.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 22 }}>
              <h2 className="serif" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "var(--ink)" }}
                contentEditable={mode === "edit"} suppressContentEditableWarning>{s.heading}</h2>
              <p className="serif" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}
                contentEditable={mode === "edit"} suppressContentEditableWarning>
                {s.body}
              </p>
            </section>
          ))}

          <div className="rule-dashed" style={{ margin: "28px 0 18px" }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>Exhibits</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {c.exhibits.map((e, i) => (
              <div key={i}>
                <Placeholder label={e.label} aspect="4 / 3" kind={e.kind} />
                <div className="mono dim text-xs" style={{ marginTop: 6 }}>{e.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex col gap-4" style={{ position: "sticky", top: 24, alignSelf: "flex-start" }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Frameworks</div>
            <div className="flex col gap-2">
              {c.frameworks.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ochre)" }} />
                  <span style={{ fontSize: 13 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Sources</div>
            <div className="flex col gap-3">
              {c.sources.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, marginBottom: 3 }}>{s.label}</div>
                  <div className="mono dim" style={{ fontSize: 10, textDecoration: "underline", textDecorationColor: "var(--rule-2)" }}>{s.url}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 16, background: "var(--ochre-bg)", border: "1px solid var(--ochre)" }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
              <Icon name="sparkles" size={14} style={{ color: "var(--ochre-ink)" }} />
              <div className="eyebrow" style={{ color: "var(--ochre-ink)" }}>AI confidence</div>
            </div>
            <div className="serif" style={{ fontSize: 22, color: "var(--ochre-ink)", fontWeight: 500 }}>High</div>
            <div style={{ fontSize: 12, color: "var(--ochre-ink)", marginTop: 4, lineHeight: 1.4, opacity: 0.8 }}>
              All three sources agree on the core facts. Dilemma framing is crisp.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== LIVE CONTROL =====
const LiveControl = ({ sessionState, dispatch, caseData }) => {
  const { questions, attendance, results, activeQuestionId, answers } = sessionState;
  const [tab, setTab] = useStateF("questions");
  const [composeOpen, setComposeOpen] = useStateF(false);

  const c = caseData;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "100%", minHeight: 0 }}>
      <div style={{ overflow: "auto", padding: "20px 28px 40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <span className="live-dot" />
              <span className="mono text-xs" style={{ color: "var(--terra)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>Live  -  14:23</span>
              <Chip>Room #HL-621</Chip>
            </div>
            <h1 className="serif" style={{ fontSize: 24, margin: 0, fontWeight: 500, letterSpacing: "-0.01em" }}>{c.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" icon="qr">Show QR</Btn>
            <Btn variant="ghost" size="sm" icon="x">End session</Btn>
          </div>
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "questions", label: "Questions", icon: "chat", count: questions.length },
            { value: "roster", label: "Roster", icon: "users", count: attendance },
            { value: "case", label: "Case", icon: "book" }
          ]}
        />

        {tab === "questions" && (
          <div style={{ padding: "20px 0" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="mono text-xs dim">{questions.length} question{questions.length === 1 ? "" : "s"}  -  {questions.filter(q => q.status === "live").length} live now</div>
              <Btn variant="default" size="sm" icon="plus" onClick={() => setComposeOpen(true)}>Add question</Btn>
            </div>

            <div className="flex col gap-3">
              {questions.map(q => (
                <QuestionCard key={q.id} q={q} dispatch={dispatch} answers={answers[q.id] || []} results={results[q.id]} attendance={attendance} activeQuestionId={activeQuestionId} />
              ))}
              {composeOpen && (
                <ComposeQuestion onCancel={() => setComposeOpen(false)} onAdd={(nq) => { dispatch({ type: "addQuestion", q: nq }); setComposeOpen(false); }} />
              )}
            </div>
          </div>
        )}

        {tab === "roster" && <RosterView attendance={attendance} answers={answers} questions={questions} />}
        {tab === "case" && (
          <div style={{ padding: "20px 0", maxWidth: 720 }}>
            <div className="doc" style={{ padding: "40px 56px" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>{c.course}</div>
              <h2 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>{c.title}</h2>
              {c.sections.map((s, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <h3 className="serif" style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{s.heading}</h3>
                  <p className="serif" style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)", margin: 0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ActivityRail attendance={attendance} questions={questions} answers={answers} />
    </div>
  );
};

const QuestionCard = ({ q, dispatch, answers, results, attendance, activeQuestionId }) => {
  const respCount = answers.length;
  const pct = Math.round((respCount / attendance) * 100);
  const isLive = q.status === "live";
  const isRevealed = q.status === "revealed";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: isLive ? "var(--ochre)" : "var(--rule)" }}>
      <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: "1px solid var(--rule)", background: isLive ? "var(--ochre-bg)" : "var(--paper-2)" }}>
        <div className="flex items-center gap-3">
          <Chip icon={q.kind === "poll" ? "check" : "edit"} tone={isLive ? "ochre" : ""}>
            {q.kind === "poll" ? (q.multi ? "Multi-select" : "Single-choice") : "Open response"}
          </Chip>
          {isLive && <span className="mono text-xs" style={{ color: "var(--ochre-ink)", fontWeight: 600, letterSpacing: "0.08em" }}> LIVE</span>}
          {isRevealed && <Chip tone="sage" icon="eye">Revealed</Chip>}
          {q.status === "draft" && <Chip>Draft</Chip>}
        </div>
        <div className="flex items-center gap-2">
          {!isLive && !isRevealed && q.status === "draft" && (
            <Btn size="sm" variant="ochre" icon="bolt" onClick={() => dispatch({ type: "pushLive", id: q.id })}>Push live</Btn>
          )}
          {isLive && (
            <>
              <span className="mono text-xs dim">{respCount} / {attendance}</span>
              <Btn size="sm" variant="sage" icon="eye" onClick={() => dispatch({ type: "reveal", id: q.id })}>Release answers</Btn>
            </>
          )}
          {isRevealed && <Btn size="sm" variant="ghost">View</Btn>}
        </div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div className="serif" style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.45, marginBottom: 14, color: "var(--ink)", textWrap: "pretty" }}>
          {q.prompt}
        </div>
        {q.kind === "poll" ? (
          <div className="flex col gap-2">
            {q.options.map(o => (
              <div key={o.id} className="flex items-center justify-between" style={{ padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: 4, background: "var(--paper)" }}>
                <div className="flex items-center gap-3">
                  <span className="mono text-xs">{o.id.toUpperCase()}</span>
                  <span>{o.label}</span>
                </div>
                {isRevealed && results && (
                  <div className="mono text-xs dim">{results[o.id] || 0} votes</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {(isLive || isRevealed) && respCount > 0 ? (
              <div className="flex col gap-2">
                {answers.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex gap-3" style={{ padding: "10px 12px", background: "var(--paper-2)", borderRadius: 3, border: "1px solid var(--rule)" }}>
                    <Avatar initials={a.avatar} color={a.color} size={22} />
                    <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", fontStyle: "italic" }}>
                      "{a.text}"
                    </div>
                  </div>
                ))}
                {answers.length > 4 && <div className="mono text-xs dim" style={{ padding: "4px 12px" }}>+ {answers.length - 4} more</div>}
              </div>
            ) : (
              <div className="mono text-xs dim" style={{ padding: "10px 0" }}>
                {q.placeholder || "Responses appear here as they come in."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ComposeQuestion = ({ onCancel, onAdd }) => {
  const [kind, setKind] = useStateF("poll");
  const [prompt, setPrompt] = useStateF("");
  const [opts, setOpts] = useStateF([{ id: "a", label: "" }, { id: "b", label: "" }]);
  const addOpt = () => setOpts([...opts, { id: String.fromCharCode(97 + opts.length), label: "" }]);
  const submit = () => {
    if (!prompt.trim()) return;
    if (kind === "poll" && opts.some(o => !o.label.trim())) return;
    onAdd({
      id: "q" + Math.random().toString(36).slice(2, 7),
      prompt,
      kind,
      multi: false,
      options: kind === "poll" ? opts : [],
      status: "draft"
    });
  };

  return (
    <div className="card" style={{ padding: 14, borderColor: "var(--ink)" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <div className="eyebrow">New question</div>
        <button onClick={onCancel} className="btn ghost sm"><Icon name="x" size={11} /> Cancel</button>
      </div>
      <div className="flex col gap-3">
        <Field label="Prompt" required>
          <textarea className="textarea" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask something students should debate" />
        </Field>
        <Field label="Type">
          <Segmented
            value={kind}
            onChange={setKind}
            size="sm"
            options={[
              { value: "poll", label: "MCQ" },
              { value: "open", label: "Open" }
            ]}
          />
        </Field>
        {kind === "poll" && (
          <Field label="Options" hint="One line per option">
            <div className="flex col gap-2">
              {opts.map((o, i) => (
                <input key={o.id} className="input" value={o.label} onChange={e => {
                  const next = opts.slice();
                  next[i] = { ...o, label: e.target.value };
                  setOpts(next);
                }} placeholder={`Option ${o.id.toUpperCase()}`} />
              ))}
              <button onClick={addOpt} className="btn ghost sm" style={{ alignSelf: "flex-start" }}>
                <Icon name="plus" size={12} /> Add option
              </button>
            </div>
          </Field>
        )}
        <div className="flex items-center justify-between">
          <div className="mono text-xs dim">Saved locally</div>
          <Btn variant="ochre" icon="check" onClick={submit}>Add question</Btn>
        </div>
      </div>
    </div>
  );
};

const RosterView = ({ attendance, answers, questions }) => (
  <div style={{ padding: "20px 0" }}>
    <div className="mono text-xs dim" style={{ marginBottom: 14 }}>{attendance} students joined  -  sync'd live</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
      {window.SEED_ROSTER.slice(0, attendance).map(s => (
        <div key={s.id} className="card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar initials={s.avatar} color={s.color} size={28} online />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
            <div className="mono dim" style={{ fontSize: 10 }}>Joined</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ActivityRail = ({ attendance, questions, answers }) => (
  <div style={{ borderLeft: "1px solid var(--rule)", background: "var(--paper-2)", padding: "18px 16px", overflow: "auto" }}>
    <div className="eyebrow" style={{ marginBottom: 10 }}>Activity</div>
    <div className="flex col gap-3">
      <ActivityItem icon="users" color="var(--ink)" text={`${attendance} students joined`} time="just now" />
      {questions.slice(0, 3).map((q, i) => (
        <ActivityItem key={q.id} icon={q.kind === "poll" ? "check" : "edit"} color="var(--ochre)" text={`Question ${i + 1} ready`} time="2 min ago" />
      ))}
      <ActivityItem icon="chat" color="var(--sage)" text="Live responses coming in" time="1 min ago" />
    </div>
  </div>
);

const ActivityItem = ({ icon, color, text, time }) => (
  <div className="flex gap-3" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--paper)", border: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
      <Icon name={icon} size={11} />
    </div>
    <div style={{ flex: 1, color: "var(--ink-2)" }}>
      {text}
      <div className="mono dim" style={{ fontSize: 10, marginTop: 2 }}>{time}</div>
    </div>
  </div>
);

// ===== FACULTY ROOT =====
const FacultyView = ({ stage, setStage, draft, setDraft, sessionState, dispatch, onGenerateCase, generateError, caseData, onOpenDraft, generateReady, generateLogs }) => {
  if (stage === "create") return <CreateCase draft={draft} setDraft={setDraft} onGenerate={onGenerateCase} error={generateError} />;
  if (stage === "generating") return <Generating draft={draft} onDone={onOpenDraft} isReady={generateReady} logs={generateLogs} />;
  if (stage === "preview") return <CasePreview caseData={caseData} onPublish={() => setStage("share")} onBack={() => setStage("create")} />;
  if (stage === "share") return <ShareScreen onStart={() => setStage("live")} onBack={() => setStage("preview")} />;
  if (stage === "live") return <LiveControl caseData={caseData} sessionState={sessionState} dispatch={dispatch} />;
  return null;
};

const ShareScreen = ({ onStart, onBack }) => (
  <div style={{ padding: "36px 36px 80px", maxWidth: 920, margin: "0 auto" }}>
    <button onClick={onBack} className="btn ghost sm"><Icon name="chevL" size={12} /> Back</button>
    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
      <div>
        <h1 className="serif" style={{ fontSize: 30, margin: "0 0 10px" }}>Share your case</h1>
        <p style={{ color: "var(--ink-3)", maxWidth: 520, lineHeight: 1.6 }}>
          Students join instantly with a QR code. You control when questions go live and when results are released.
        </p>
        <div className="card" style={{ padding: 16, marginTop: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Join URL</div>
          <div className="flex items-center gap-2">
            <input className="input" value="livecase.ai/room/HL-621" readOnly />
            <Btn variant="ghost" size="sm" icon="link">Copy</Btn>
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Start session</div>
          <div className="flex items-center justify-between">
            <div className="mono dim text-xs">Room opens when you start.</div>
            <Btn variant="ochre" icon="bolt" onClick={onStart}>Go live</Btn>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 18, textAlign: "center" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>QR join</div>
        <QR label="HL-621" />
        <div className="mono dim" style={{ fontSize: 10, marginTop: 10 }}>Scan to join in 5 seconds</div>
      </div>
    </div>
  </div>
);

Object.assign(window, { FacultyView });

