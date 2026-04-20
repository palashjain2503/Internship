// Seed data for static frontend preview (no backend wired yet)
window.CASE_DATA = {
  title: "Helion Labs: Betting the Farm on Agents",
  subtitle: "A platform dilemma in vertical AI",
  subject: "Technology & Strategy",
  course: "STR-621",
  instructor: "Prof. Ananya Rao",
  readingTime: "7 min read",
  wordCount: 1080,
  generatedAt: "Generated 10:42 AM",
  frameworks: ["Porter's Five Forces", "Platform vs. Pipeline", "Value Chain"],
  sections: [
    {
      heading: "The platform bet",
      body: "Helion Labs built a data platform for industrial maintenance. The product now faces a strategic fork: open the platform to third-party agents, ship first-party agents, or stay focused on reporting. Each path affects margins, speed to market, and competitive defensibility."
    },
    {
      heading: "Competitive pressure",
      body: "Horizontal AI platforms are moving downmarket while niche verticals are launching agent marketplaces. Customer CIOs want workflow ownership and are experimenting with DIY agents that reduce vendor lock-in."
    },
    {
      heading: "Decision stakes",
      body: "The board expects a recommendation on Monday. The CFO wants predictable revenue and lower compliance exposure, while the CTO argues for openness to attract developers and data partners."
    }
  ],
  exhibits: [
    { label: "Exhibit A", title: "Segment revenue mix", kind: "chart" },
    { label: "Exhibit B", title: "Platform adoption curve", kind: "chart" },
    { label: "Exhibit C", title: "Competitive map", kind: "matrix" }
  ],
  sources: [
    { label: "The Information  -  AI Agents 2026", url: "https://theinformation.com/ai-agents-2026" },
    { label: "a16z  -  Vertical Agents", url: "https://a16z.com/vertical-agents" },
    { label: "Helion Labs Q1 2026", url: "https://investor.helionlabs.com/q1-26" }
  ]
};

window.SEED_QUESTIONS = [
  {
    id: "q1",
    kind: "poll",
    multi: false,
    status: "draft",
    prompt: "Which go-to-market path best preserves Helion's bargaining power?",
    options: [
      { id: "a", label: "Open the platform to third-party agents" },
      { id: "b", label: "Build only first-party agents" },
      { id: "c", label: "Hybrid: open core, certify partners" },
      { id: "d", label: "Stay focused on reporting" }
    ]
  },
  {
    id: "q2",
    kind: "open",
    status: "draft",
    prompt: "How do the Five Forces change if Helion opens the platform?",
    placeholder: "Name the forces most impacted and why."
  }
];

window.SEED_ROSTER = [
  { id: "s1", name: "Aarav K.", avatar: "AK", color: "#3f6f8a" },
  { id: "s2", name: "Riya P.", avatar: "RP", color: "#7a3c3c" },
  { id: "s3", name: "Neel S.", avatar: "NS", color: "#4f6b3c" },
  { id: "s4", name: "Meera V.", avatar: "MV", color: "#7c5b2c" },
  { id: "s5", name: "Ishan D.", avatar: "ID", color: "#6b4c7a" },
  { id: "s6", name: "Sara Q.", avatar: "SQ", color: "#3e5c7a" },
  { id: "s7", name: "Nikhil R.", avatar: "NR", color: "#8b5a3a" },
  { id: "s8", name: "Devika L.", avatar: "DL", color: "#3f7a67" },
  { id: "s9", name: "Jon M.", avatar: "JM", color: "#5b4e7a" },
  { id: "s10", name: "Anya T.", avatar: "AT", color: "#7a6b3c" },
  { id: "s11", name: "Omar H.", avatar: "OH", color: "#5c7a3c" },
  { id: "s12", name: "Lena C.", avatar: "LC", color: "#7a3c5c" },
  { id: "s13", name: "Jai G.", avatar: "JG", color: "#3c7a5a" },
  { id: "s14", name: "Priya N.", avatar: "PN", color: "#4b6a88" },
  { id: "s15", name: "Amir Z.", avatar: "AZ", color: "#7a4b4b" },
  { id: "s16", name: "Sana F.", avatar: "SF", color: "#4b7a6a" },
  { id: "s17", name: "Vik K.", avatar: "VK", color: "#7a6a4b" },
  { id: "s18", name: "Maya R.", avatar: "MR", color: "#4b5b7a" }
];

window.QR_PATTERN = Array.from({ length: 21 }, (_, i) =>
  Array.from({ length: 21 }, (_, j) =>
    (i % 2 === 0 && j % 3 === 0) || (i % 5 === 0 && j % 2 === 0)
  )
);

