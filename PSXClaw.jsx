"use client";
import { useState, useEffect, useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const STOCKS = [
  { ticker: "SYS",   name: "Systems Limited",      sector: "Technology" },
  { ticker: "MEBL",  name: "Meezan Bank",           sector: "Banking" },
  { ticker: "OGDC",  name: "Oil & Gas Dev Corp",    sector: "Energy" },
  { ticker: "PSO",   name: "Pakistan State Oil",    sector: "Energy" },
  { ticker: "HBL",   name: "Habib Bank Ltd",        sector: "Banking" },
  { ticker: "MCB",   name: "MCB Bank",              sector: "Banking" },
  { ticker: "ENGRO", name: "Engro Corporation",     sector: "Conglomerate" },
  { ticker: "LUCK",  name: "Lucky Cement",          sector: "Cement" },
  { ticker: "TRG",   name: "TRG Pakistan",          sector: "Technology" },
  { ticker: "MARI",  name: "Mari Petroleum",        sector: "Energy" },
  { ticker: "UBL",   name: "United Bank Ltd",       sector: "Banking" },
  { ticker: "NESTLE",name: "Nestle Pakistan",       sector: "FMCG" },
];

const STRATEGIES = [
  { value: "DCA",      label: "Dollar-Cost Averaging", desc: "Systematic entry in tranches" },
  { value: "SWING",    label: "Swing Trading",         desc: "Short-term price movements" },
  { value: "VALUE",    label: "Value Investing",       desc: "Undervalued fundamentals" },
  { value: "GROWTH",   label: "Growth Investing",      desc: "Long-term capital appreciation" },
  { value: "DIVIDEND", label: "Dividend Income",       desc: "Regular yield generation" },
];

const TIMEFRAMES = ["1 Week", "1 Month", "3 Months", "6 Months", "1 Year", "3+ Years"];
const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];

// ─── Styles ──────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #EEE9E0;
    --surface:   #E8E2D8;
    --surface2:  #DED7CA;
    --card:      #F2EDE4;
    --border:    rgba(28,24,16,0.13);
    --border2:   rgba(28,24,16,0.22);
    --text1:     #1A1714;
    --text2:     #4A4540;
    --text3:     #7A736A;
    --green:     #0B6B49;
    --green2:    #0D8A5E;
    --green-bg:  #E4F0EB;
    --green-bd:  rgba(11,107,73,0.25);
    --red:       #8B2020;
    --red-bg:    #F5E8E8;
    --shadow:    0 1px 3px rgba(28,24,16,0.08), 0 4px 16px rgba(28,24,16,0.06);
    --shadow-sm: 0 1px 2px rgba(28,24,16,0.06);
    --radius:    10px;
    --radius-lg: 16px;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text1);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Header ── */
  .hdr {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    padding: 0 clamp(16px, 4vw, 48px);
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 200;
    box-shadow: var(--shadow-sm);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo-mark {
    width: 32px;
    height: 32px;
    background: var(--green);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -0.5px;
    flex-shrink: 0;
  }

  .logo-name {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text1);
    letter-spacing: -0.3px;
  }

  .logo-name span { color: var(--green); }

  .hdr-tag {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--text3);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 5px 12px;
    border-radius: 20px;
  }

  /* ── Hero ── */
  .hero {
    padding: clamp(40px,6vh,72px) clamp(16px,4vw,48px) clamp(28px,4vh,48px);
    max-width: 860px;
    margin: 0 auto;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--green);
    margin-bottom: 14px;
  }

  .hero-kicker::before {
    content: '';
    display: block;
    width: 18px;
    height: 2px;
    background: var(--green);
    border-radius: 2px;
  }

  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.8px;
    color: var(--text1);
    margin-bottom: 14px;
  }

  .hero h1 em {
    font-style: italic;
    color: var(--green);
  }

  .hero-sub {
    font-size: clamp(14px, 2vw, 16px);
    color: var(--text2);
    line-height: 1.7;
    max-width: 520px;
    font-weight: 300;
  }

  /* ── Form wrap ── */
  .form-wrap {
    max-width: 860px;
    margin: 0 auto;
    padding: 0 clamp(16px, 4vw, 48px) 80px;
  }

  /* ── Section label ── */
  .slabel {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slabel-num {
    width: 18px;
    height: 18px;
    background: var(--green-bg);
    border: 1px solid var(--green-bd);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: var(--green);
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .section-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 28px 0;
  }

  /* ── Stock chips ── */
  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .chip {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px 8px 12px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    min-width: 72px;
    box-shadow: var(--shadow-sm);
  }

  .chip:hover {
    border-color: var(--green2);
    background: var(--green-bg);
  }

  .chip.active {
    background: var(--green-bg);
    border-color: var(--green);
    box-shadow: 0 0 0 1px var(--green);
  }

  .chip-ticker {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text1);
    display: block;
  }

  .chip.active .chip-ticker { color: var(--green); }

  .chip-name {
    font-size: 9px;
    color: var(--text3);
    display: block;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 72px;
  }

  /* ── Text input ── */
  .input {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: var(--text1);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: var(--shadow-sm);
  }

  .input:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(11,107,73,0.1);
  }

  .input::placeholder { color: var(--text3); }

  /* ── Strategy cards ── */
  .strategy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 10px;
  }

  .strat-btn {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 14px 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }

  .strat-btn:hover {
    border-color: var(--green2);
    background: var(--green-bg);
  }

  .strat-btn.active {
    background: var(--green-bg);
    border-color: var(--green);
    box-shadow: 0 0 0 1px var(--green);
  }

  .strat-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text1);
    display: block;
    margin-bottom: 3px;
  }

  .strat-btn.active .strat-label { color: var(--green); }

  .strat-desc {
    font-size: 11px;
    color: var(--text3);
    line-height: 1.4;
    display: block;
  }

  /* ── Pill group ── */
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .pill {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 7px 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text2);
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }

  .pill:hover {
    border-color: var(--green2);
    color: var(--green);
  }

  .pill.active {
    background: var(--green-bg);
    border-color: var(--green);
    color: var(--green);
    font-weight: 600;
    box-shadow: 0 0 0 1px var(--green);
  }

  /* ── Two-col row ── */
  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── Summary bar (shows before submit) ── */
  .summary-bar {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 20px;
  }

  .sum-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
  }

  .sum-key { color: var(--text3); font-weight: 400; }
  .sum-val { color: var(--text1); font-weight: 600; }

  .sum-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--border2);
  }

  /* ── Generate button ── */
  .gen-btn {
    width: 100%;
    padding: 16px 24px;
    background: var(--green);
    border: none;
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 2px 8px rgba(11,107,73,0.25);
    letter-spacing: 0.1px;
  }

  .gen-btn:hover:not(:disabled) {
    background: var(--green2);
    box-shadow: 0 4px 16px rgba(11,107,73,0.3);
    transform: translateY(-1px);
  }

  .gen-btn:active:not(:disabled) { transform: translateY(0); }

  .gen-btn:disabled {
    background: var(--surface2);
    color: var(--text3);
    cursor: not-allowed;
    box-shadow: none;
  }

  /* ── Loading indicator ── */
  .loading-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 40px 32px;
    text-align: center;
    box-shadow: var(--shadow);
    margin-top: 32px;
  }

  .spinner-ring {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface2);
    border-top-color: var(--green);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-text {
    font-size: 14px;
    color: var(--text2);
    line-height: 1.6;
  }

  .loading-steps {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .l-step {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 12px;
    background: var(--surface);
    color: var(--text3);
    border: 1px solid var(--border);
  }

  .l-step.done {
    background: var(--green-bg);
    color: var(--green);
    border-color: var(--green-bd);
  }

  /* ── Report ── */
  .report-wrap {
    max-width: 860px;
    margin: 0 auto;
    padding: clamp(24px,4vh,48px) clamp(16px,4vw,48px) 80px;
  }

  /* report header */
  .report-hdr {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 2px solid var(--border);
  }

  .rh-left { display: flex; align-items: center; gap: 16px; }

  .rh-ticker {
    font-family: 'Playfair Display', serif;
    font-size: 42px;
    font-weight: 700;
    color: var(--green);
    line-height: 1;
    letter-spacing: -1px;
  }

  .rh-meta { display: flex; flex-direction: column; gap: 6px; }
  .rh-name { font-size: 15px; font-weight: 600; color: var(--text1); }

  .rh-tags { display: flex; gap: 6px; flex-wrap: wrap; }

  .rh-tag {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 4px;
    background: var(--green-bg);
    border: 1px solid var(--green-bd);
    color: var(--green);
  }

  .rh-right { text-align: right; }

  .rh-ts {
    font-size: 11px;
    color: var(--text3);
    line-height: 1.7;
  }

  .rh-ts strong { color: var(--text2); font-weight: 600; }

  /* report body */
  .report-body {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: clamp(20px,4vw,40px);
    box-shadow: var(--shadow);
    border-top: 3px solid var(--green);
  }

  .report-body h2 {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--green);
    margin: 32px 0 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .report-body h2:first-child { margin-top: 0; }

  .report-body h2::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .report-body h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text1);
    margin: 18px 0 8px;
  }

  .report-body p {
    font-size: 15px;
    color: var(--text2);
    line-height: 1.8;
    margin-bottom: 12px;
  }

  .report-body strong { color: var(--text1); font-weight: 600; }

  .report-body ul {
    list-style: none;
    padding: 0;
    margin-bottom: 14px;
  }

  .report-body ul li {
    font-size: 14px;
    color: var(--text2);
    line-height: 1.75;
    padding: 7px 0 7px 18px;
    position: relative;
    border-bottom: 1px solid var(--border);
  }

  .report-body ul li:last-child { border-bottom: none; }

  .report-body ul li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--green);
    opacity: 0.6;
  }

  /* verdict box */
  .verdict-box {
    background: var(--green-bg);
    border: 1px solid var(--green-bd);
    border-left: 3px solid var(--green);
    border-radius: 8px;
    padding: 18px 20px;
    margin-top: 8px;
  }

  .verdict-box p { color: var(--text1); margin-bottom: 0; }

  /* error box */
  .err-box {
    background: var(--red-bg);
    border: 1px solid rgba(139,32,32,0.2);
    border-radius: var(--radius);
    padding: 16px 18px;
    font-size: 13px;
    color: var(--red);
    margin-top: 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  /* action bar below report */
  .report-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .btn-outline {
    padding: 11px 22px;
    background: var(--card);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--text1);
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: var(--shadow-sm);
  }

  .btn-outline:hover {
    background: var(--surface);
    border-color: var(--green);
    color: var(--green);
  }

  .btn-green {
    padding: 11px 22px;
    background: var(--green);
    border: none;
    border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-green:hover { background: var(--green2); }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid var(--border);
    padding: 20px clamp(16px,4vw,48px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    background: var(--card);
  }

  .footer-text {
    font-size: 12px;
    color: var(--text3);
  }

  .footer-disc {
    font-size: 11px;
    color: var(--text3);
    text-align: right;
    max-width: 420px;
    line-height: 1.5;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .row2 { grid-template-columns: 1fr; gap: 16px; }
    .strategy-grid { grid-template-columns: 1fr 1fr; }
    .rh-left { gap: 12px; }
    .rh-ticker { font-size: 32px; }
    .report-actions { flex-direction: column; }
    .btn-outline, .btn-green { width: 100%; text-align: center; }
    .footer { flex-direction: column; align-items: flex-start; }
    .footer-disc { text-align: left; max-width: 100%; }
  }

  @media (max-width: 400px) {
    .strategy-grid { grid-template-columns: 1fr; }
    .chip-grid { gap: 6px; }
  }

  /* ── Fade-in animation ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .fade-up { animation: fadeUp 0.4s ease forwards; }

  /* ── Dots loading ── */
  @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
  .dot { display: inline-block; width:5px; height:5px; border-radius:50%; background:currentColor; animation: blink 1.2s infinite; margin:0 2px; }
  .dot:nth-child(2){animation-delay:.2s}
  .dot:nth-child(3){animation-delay:.4s}
`;

// ─── HTML Parser ──────────────────────────────────────────────────────────────

function renderReport(text) {
  const lines = text.split("\n");
  let html = "";
  let inUL = false;
  let inVerdict = false;

  for (let raw of lines) {
    let line = raw
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

    if (/^#{1,2}\s/.test(line)) {
      if (inUL) { html += "</ul>"; inUL = false; }
      const heading = line.replace(/^#{1,2}\s/, "");
      if (inVerdict) { html += "</div>"; inVerdict = false; }
      if (/verdict/i.test(heading)) {
        html += `<h2>${heading}</h2><div class="verdict-box">`;
        inVerdict = true;
      } else {
        html += `<h2>${heading}</h2>`;
      }
    } else if (/^###\s/.test(line)) {
      if (inUL) { html += "</ul>"; inUL = false; }
      html += `<h3>${line.replace(/^###\s/, "")}</h3>`;
    } else if (/^[-•*]\s/.test(line)) {
      if (!inUL) { html += "<ul>"; inUL = true; }
      html += `<li>${line.replace(/^[-•*]\s/, "")}</li>`;
    } else if (line.trim() === "") {
      if (inUL) { html += "</ul>"; inUL = false; }
    } else if (line.trim()) {
      if (inUL) { html += "</ul>"; inUL = false; }
      html += `<p>${line}</p>`;
    }
  }

  if (inUL) html += "</ul>";
  if (inVerdict) html += "</div>";
  return html;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PSXClaw() {
  const [ticker,    setTicker]    = useState("SYS");
  const [custom,    setCustom]    = useState("");
  const [strategy,  setStrategy]  = useState("DCA");
  const [timeframe, setTimeframe] = useState("3 Months");
  const [risk,      setRisk]      = useState("Moderate");
  const [price,     setPrice]     = useState("");
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [loadStep,  setLoadStep]  = useState(0);
  const [report,    setReport]    = useState("");
  const [error,     setError]     = useState("");
  const [timestamp, setTimestamp] = useState("");
  const reportRef = useRef(null);

  const activeTicker = custom.trim().toUpperCase() || ticker;
  const stockData    = STOCKS.find(s => s.ticker === activeTicker);
  const stratData    = STRATEGIES.find(s => s.value === strategy);

  const LOAD_STEPS = ["Reading inputs", "Building prompt", "Consulting AI", "Formatting report"];

  // Simulate loading steps while waiting
  useEffect(() => {
    if (!loading) { setLoadStep(0); return; }
    const t = setInterval(() => {
      setLoadStep(p => (p < LOAD_STEPS.length - 1 ? p + 1 : p));
    }, 900);
    return () => clearInterval(t);
  }, [loading]);

  // Scroll to report when it arrives
  useEffect(() => {
    if (report && reportRef.current) {
      setTimeout(() => reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [report]);

  // ── Build prompt ──
  const buildPrompt = () => `You are a Senior PSX (Pakistan Stock Exchange) Equity Analyst with 15+ years covering KSE-100 stocks. Your analysis is rigorous, direct, and trusted by institutional investors in Pakistan.

Generate a comprehensive investment analysis report for:

STOCK: ${activeTicker}${stockData ? ` — ${stockData.name} (${stockData.sector} sector)` : ""}
STRATEGY: ${stratData?.label}
INVESTMENT HORIZON: ${timeframe}
RISK PROFILE: ${risk}
${price ? `CURRENT MARKET PRICE: ₨${price}` : ""}
${notes ? `ADDITIONAL CONTEXT FROM INVESTOR: ${notes}` : ""}

Use these EXACT section headers (## format):

## EXECUTIVE SUMMARY
Write 2–3 sentences giving a direct, high-conviction verdict on this stock for the stated strategy and timeframe. Lead with the conclusion.

## INVESTMENT THESIS
Explain why this stock does or does not suit the stated strategy. Cover: sector dynamics in Pakistan's current macro environment, competitive positioning, tailwinds and headwinds (inflation, PKR depreciation, SBP policy rate, geopolitical exposure, energy costs, IT exports, etc.).

## RISK ANALYSIS
List exactly 4 risks, each with a rating (Low / Medium / High). Include currency risk, regulatory/political risk, and sector-specific risks. Format each as a bullet.

## TECHNICAL OVERVIEW
Key support and resistance levels to watch. Volume trend and momentum signals relevant to KSE-100. ${price ? `Reference current price ₨${price} when discussing levels.` : "Discuss general price behaviour."} Include what a breakout or breakdown scenario looks like.

## STRATEGY-SPECIFIC GUIDANCE
Concrete, actionable steps for ${stratData?.label}:
- Entry approach (price levels, conditions)
- Suggested position sizing (% of portfolio)
- Exit criteria and stop-loss level
- For DCA specifically: recommend a tranche schedule (e.g. 3 tranches over X weeks)
- Expected return range for this timeframe

## VERDICT
State clearly: BUY / HOLD / AVOID — with a confidence level (Low / Medium / High). Give one decisive sentence explaining the call. Be direct. Do not hedge excessively.

Style rules: Use Pakistani Rupee ₨ for all prices. Reference KSE-100 context throughout. Write professionally but clearly — no jargon without explanation. Be specific, not generic.`;

  // ── Generate ──
  const generate = async () => {
    if (!activeTicker || loading) return;
    setLoading(true);
    setError("");
    setReport("");
    setTimestamp(
      new Date().toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " PKT"
    );

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      if (!text) throw new Error("Empty response from AI.");
      setReport(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Render ──
  return (
    <>
      <style>{css}</style>

      {/* ── Header ── */}
      <header className="hdr">
        <div className="logo">
          <div className="logo-mark">P</div>
          <span className="logo-name">PSX<span>Claw</span></span>
        </div>
        <span className="hdr-tag">KSE-100 AI Analyst</span>
      </header>

      {/* ══════════ FORM VIEW ══════════ */}
      {!report && (
        <>
          {/* Hero */}
          <div className="hero fade-up">
            <div className="hero-kicker">AI-Powered Equity Research</div>
            <h1>Institutional-grade<br /><em>PSX analysis.</em></h1>
            <p className="hero-sub">
              Select a stock, pick your strategy, and receive a structured analyst
              report in seconds — no chatbot, no noise. Just clear investment guidance.
            </p>
          </div>

          {/* Form */}
          <div className="form-wrap fade-up">

            {/* ── Step 1: Stock ── */}
            <div className="slabel">
              <span className="slabel-num">1</span>
              Select Stock
            </div>
            <div className="chip-grid">
              {STOCKS.map(s => (
                <div
                  key={s.ticker}
                  className={`chip ${ticker === s.ticker && !custom ? "active" : ""}`}
                  onClick={() => { setTicker(s.ticker); setCustom(""); }}
                >
                  <span className="chip-ticker">{s.ticker}</span>
                  <span className="chip-name">{s.name}</span>
                </div>
              ))}
            </div>
            <input
              className="input"
              style={{ marginTop: 10, marginBottom: 28 }}
              placeholder="Or type any KSE ticker — e.g. KOHC, PAEL, COLG..."
              value={custom}
              onChange={e => setCustom(e.target.value.toUpperCase())}
              maxLength={8}
            />

            <hr className="section-divider" />

            {/* ── Step 2: Strategy ── */}
            <div className="slabel" style={{ marginBottom: 12 }}>
              <span className="slabel-num">2</span>
              Investment Strategy
            </div>
            <div className="strategy-grid" style={{ marginBottom: 28 }}>
              {STRATEGIES.map(s => (
                <button
                  key={s.value}
                  className={`strat-btn ${strategy === s.value ? "active" : ""}`}
                  onClick={() => setStrategy(s.value)}
                >
                  <span className="strat-label">{s.label}</span>
                  <span className="strat-desc">{s.desc}</span>
                </button>
              ))}
            </div>

            <hr className="section-divider" />

            {/* ── Step 3 & 4 ── */}
            <div className="row2" style={{ marginBottom: 28 }}>
              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">3</span>
                  Investment Horizon
                </div>
                <div className="pill-row">
                  {TIMEFRAMES.map(t => (
                    <button
                      key={t}
                      className={`pill ${timeframe === t ? "active" : ""}`}
                      onClick={() => setTimeframe(t)}
                    >{t}</button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">4</span>
                  Risk Appetite
                </div>
                <div className="pill-row">
                  {RISK_LEVELS.map(r => (
                    <button
                      key={r}
                      className={`pill ${risk === r ? "active" : ""}`}
                      onClick={() => setRisk(r)}
                    >{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="section-divider" />

            {/* ── Step 5 & 6 ── */}
            <div className="row2" style={{ marginBottom: 28 }}>
              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">5</span>
                  Current Market Price ₨ &nbsp;
                  <span style={{ color: "var(--text3)", letterSpacing: 0, fontWeight: 400, textTransform: "none" }}>optional</span>
                </div>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g.  125.50"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                />
              </div>

              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">6</span>
                  Your Context &nbsp;
                  <span style={{ color: "var(--text3)", letterSpacing: 0, fontWeight: 400, textTransform: "none" }}>optional</span>
                </div>
                <input
                  className="input"
                  placeholder="e.g.  Waiting for post-Eid dip..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Summary preview bar */}
            <div className="summary-bar">
              <div className="sum-item">
                <span className="sum-key">Stock</span>
                <span className="sum-val">{activeTicker}</span>
              </div>
              <div className="sum-dot" />
              <div className="sum-item">
                <span className="sum-key">Strategy</span>
                <span className="sum-val">{stratData?.label}</span>
              </div>
              <div className="sum-dot" />
              <div className="sum-item">
                <span className="sum-key">Horizon</span>
                <span className="sum-val">{timeframe}</span>
              </div>
              <div className="sum-dot" />
              <div className="sum-item">
                <span className="sum-key">Risk</span>
                <span className="sum-val">{risk}</span>
              </div>
              {price && (
                <>
                  <div className="sum-dot" />
                  <div className="sum-item">
                    <span className="sum-key">Price</span>
                    <span className="sum-val">₨{price}</span>
                  </div>
                </>
              )}
            </div>

            {/* Generate button */}
            <button
              className="gen-btn"
              onClick={generate}
              disabled={loading || !activeTicker}
            >
              {loading ? (
                <>
                  Analysing {activeTicker}
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </>
              ) : (
                `Generate ${activeTicker} Analysis →`
              )}
            </button>

            {/* Loading card */}
            {loading && (
              <div className="loading-card fade-up">
                <div className="spinner-ring" />
                <p className="loading-text">
                  Consulting senior PSX analyst AI for <strong>{activeTicker}</strong>...
                </p>
                <div className="loading-steps">
                  {LOAD_STEPS.map((s, i) => (
                    <span key={i} className={`l-step ${i <= loadStep ? "done" : ""}`}>
                      {i <= loadStep ? "✓ " : ""}{s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="err-box fade-up">
                <span>⚠</span>
                <span>{error} — Check your API key and try again.</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════ REPORT VIEW ══════════ */}
      {report && (
        <div className="report-wrap fade-up" ref={reportRef}>

          {/* Report header */}
          <div className="report-hdr">
            <div className="rh-left">
              <div className="rh-ticker">{activeTicker}</div>
              <div className="rh-meta">
                <span className="rh-name">{stockData?.name || activeTicker}</span>
                <div className="rh-tags">
                  <span className="rh-tag">{stockData?.sector || "KSE-100"}</span>
                  <span className="rh-tag">{stratData?.label}</span>
                  <span className="rh-tag">{timeframe}</span>
                  <span className="rh-tag">{risk} risk</span>
                  {price && <span className="rh-tag">₨{price}</span>}
                </div>
              </div>
            </div>
            <div className="rh-right">
              <p className="rh-ts">
                <strong>AI Analyst Report</strong><br />
                {timestamp}
              </p>
            </div>
          </div>

          {/* Report body */}
          <div
            className="report-body"
            dangerouslySetInnerHTML={{ __html: renderReport(report) }}
          />

          {/* Disclaimer */}
          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 16, lineHeight: 1.6 }}>
            ⚠ This report is generated by AI and is for informational purposes only.
            It does not constitute financial advice. Always do your own research before investing.
          </p>

          {/* Action buttons */}
          <div className="report-actions">
            <button className="btn-outline" onClick={reset}>← New Analysis</button>
            <button
              className="btn-outline"
              onClick={() => {
                const el = document.querySelector(".report-body");
                if (el) {
                  const text = el.innerText;
                  navigator.clipboard?.writeText(text);
                  alert("Report copied to clipboard!");
                }
              }}
            >
              Copy Report
            </button>
            <button
              className="btn-outline"
              onClick={() => window.print()}
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <span className="footer-text">PSXClaw © 2025 — KSE-100 AI Analyst</span>
        <span className="footer-disc">
          For informational use only. Not financial advice.
          Investing in equities involves risk of loss.
        </span>
      </footer>
    </>
  );
}
