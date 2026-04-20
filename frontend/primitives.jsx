// Shared icons + primitives for LiveCase.ai
// Exported to window at the end of this file.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --- Inline SVG icons (hairline, warm academic) ---
const Icon = ({ name, size = 16, stroke = 1.5, style }) => {
  const s = { width: size, height: size, display: "inline-block", flexShrink: 0, ...(style || {}) };
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: s
  };
  switch (name) {
    case "plus": return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "link": return <svg {...common}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>;
    case "file": return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 13h4M10 17h4M10 9h2"/></svg>;
    case "upload": return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
    case "sparkles": return <svg {...common}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>;
    case "send": return <svg {...common}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>;
    case "qr": return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M17 17v4M20 20h1"/></svg>;
    case "mic": return <svg {...common}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/></svg>;
    case "chat": return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case "users": return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/></svg>;
    case "edit": return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4z"/></svg>;
    case "share": return <svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>;
    case "download": return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case "check": return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case "x": return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "chevR": return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
    case "chevL": return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>;
    case "chevD": return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case "arrR": return <svg {...common}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case "bolt": return <svg {...common}><path d="m13 2-7 12h6l-1 8 7-12h-6z"/></svg>;
    case "book": return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/></svg>;
    case "eye": return <svg {...common}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case "dot": return <svg {...common}><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>;
    case "mon": return <svg {...common}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
    case "logo": return (
      <svg viewBox="0 0 24 24" style={s}>
        <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor"/>
        <path d="M8 9v6M8 9h4v3H8M16 9v6" stroke="var(--paper)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    default: return null;
  }
};

// --- Logo ---
const Logo = ({ size = 22 }) => (
  <div className="flex items-center gap-2" style={{ color: "var(--ink)" }}>
    <Icon name="logo" size={size} />
    <span style={{ fontFamily: "var(--font-serif)", fontSize: size * 0.95, fontWeight: 600, letterSpacing: "-0.01em", fontStyle: "italic" }}>
      LiveCase<span style={{ color: "var(--ochre)", fontStyle: "normal" }}>.</span>ai
    </span>
  </div>
);

// --- Chip ---
const Chip = ({ tone, children, icon }) => (
  <span className={`chip ${tone || ""}`}>
    {icon && <Icon name={icon} size={10} stroke={2} />}
    {children}
  </span>
);

// --- Button ---
const Btn = ({ variant = "default", size, icon, iconRight, children, onClick, disabled, type, style }) => {
  const cls = `btn ${variant === "ghost" ? "ghost" : variant === "ochre" ? "ochre" : variant === "sage" ? "sage" : ""} ${size === "sm" ? "sm" : ""}`;
  return (
    <button type={type || "button"} className={cls} onClick={onClick} disabled={disabled} style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer", ...style }}>
      {icon && <Icon name={icon} size={14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={14} />}
    </button>
  );
};

// --- Avatar ---
const Avatar = ({ initials, color, size = 28, online }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: color || "var(--paper-3)",
    color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.36, fontWeight: 600, fontFamily: "var(--font-sans)",
    border: "1.5px solid var(--paper)", position: "relative", flexShrink: 0
  }}>
    {initials}
    {online && <span style={{
      position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%",
      background: "var(--sage)", border: "1.5px solid var(--paper)"
    }} />}
  </div>
);

// --- QR Code rendered from data pattern ---
const QR = ({ size = 180, label }) => {
  const grid = window.QR_PATTERN;
  return (
    <div style={{ display: "inline-block", padding: 12, background: "var(--paper)", border: "1px solid var(--rule)", borderRadius: 6, boxShadow: "var(--shadow-sm)" }}>
      <svg width={size} height={size} viewBox={`0 0 ${grid.length} ${grid.length}`} style={{ display: "block" }}>
        {grid.map((row, i) => row.map((v, j) => v ? (
          <rect key={`${i}-${j}`} x={j} y={i} width={1.02} height={1.02} fill="var(--ink)" />
        ) : null))}
      </svg>
      {label && <div className="mono" style={{ textAlign: "center", fontSize: 10, color: "var(--ink-3)", marginTop: 8, letterSpacing: "0.1em" }}>{label}</div>}
    </div>
  );
};

// --- Segmented switcher ---
const Segmented = ({ options, value, onChange, size }) => (
  <div style={{
    display: "inline-flex", background: "var(--paper-2)", border: "1px solid var(--rule)",
    borderRadius: 100, padding: 3, gap: 2
  }}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)} style={{
        border: "none", cursor: "pointer",
        padding: size === "sm" ? "4px 10px" : "6px 14px",
        fontSize: size === "sm" ? 11 : 12,
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        borderRadius: 100,
        background: value === o.value ? "var(--paper)" : "transparent",
        color: value === o.value ? "var(--ink)" : "var(--ink-3)",
        boxShadow: value === o.value ? "var(--shadow-sm)" : "none",
        transition: "all 0.15s ease",
        display: "inline-flex", alignItems: "center", gap: 6
      }}>
        {o.icon && <Icon name={o.icon} size={12} />}
        {o.label}
      </button>
    ))}
  </div>
);

// --- Placeholder image/exhibit (hatched) ---
const Placeholder = ({ label, aspect = "16 / 9", kind = "chart" }) => (
  <div style={{
    aspectRatio: aspect,
    background: `repeating-linear-gradient(135deg, var(--paper-2) 0 6px, var(--paper) 6px 12px)`,
    border: "1px solid var(--rule)",
    borderRadius: 3,
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", overflow: "hidden"
  }}>
    <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--paper)", padding: "4px 8px", border: "1px solid var(--rule)" }}>
      {label || `${kind} placeholder`}
    </div>
  </div>
);

// --- Tab bar (underline) ---
const Tabs = ({ tabs, value, onChange }) => (
  <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--rule)" }}>
    {tabs.map(t => {
      const active = value === t.value;
      return (
        <button key={t.value} onClick={() => onChange(t.value)} style={{
          border: "none", background: "transparent", cursor: "pointer",
          padding: "10px 14px",
          fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 500,
          color: active ? "var(--ink)" : "var(--ink-3)",
          borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
          marginBottom: -1,
          display: "inline-flex", alignItems: "center", gap: 6
        }}>
          {t.icon && <Icon name={t.icon} size={13} />}
          {t.label}
          {t.count != null && <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{t.count}</span>}
        </button>
      );
    })}
  </div>
);

// --- Progress bar ---
const Progress = ({ value, color }) => (
  <div style={{ height: 4, background: "var(--paper-3)", borderRadius: 100, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: color || "var(--ink)", transition: "width 0.6s cubic-bezier(.2,.7,.3,1)" }} />
  </div>
);

Object.assign(window, { Icon, Logo, Chip, Btn, Avatar, QR, Segmented, Placeholder, Tabs, Progress });

