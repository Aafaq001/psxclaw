"use client";
import { useState, useEffect, useRef, useMemo } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const STOCKS = [
  { ticker: "SYS", name: "Systems Limited", sector: "Technology" },
  { ticker: "MEBL", name: "Meezan Bank", sector: "Banking" },
  { ticker: "OGDC", name: "Oil & Gas Dev Corp", sector: "Energy" },
  { ticker: "PSO", name: "Pakistan State Oil", sector: "Energy" },
  { ticker: "HBL", name: "Habib Bank Ltd", sector: "Banking" },
  { ticker: "MCB", name: "MCB Bank", sector: "Banking" },
  { ticker: "ENGRO", name: "Engro Corporation", sector: "Conglomerate" },
  { ticker: "LUCK", name: "Lucky Cement", sector: "Cement" },
  { ticker: "TRG", name: "TRG Pakistan", sector: "Technology" },
  { ticker: "MARI", name: "Mari Petroleum", sector: "Energy" },
  { ticker: "UBL", name: "United Bank Ltd", sector: "Banking" },
  { ticker: "NESTLE", name: "Nestle Pakistan", sector: "FMCG" },
];

// Using a Set for O(1) lookup efficiency during validation
const VALID_KSE_TICKERS = new Set([
  "SYS", "MEBL", "OGDC", "PSO", "HBL", "MCB", "ENGRO", "LUCK", "TRG", "MARI", "UBL", "NESTLE",
  "HUBC", "FFC", "EFERT", "POL", "PPL", "BAHL", "MTL", "DAWH", "FCEPL", "THALL", "INIL", "ISL",
  "PSMC", "INDU", "HCAR", "NATF", "SEARL", "AGP", "ABOT", "GLAXO", "MUREB", "PAEL", "COLG",
  "BOP", "NBP", "BAFL", "AKBL", "SNBL", "FABL", "DGKC", "FCCL", "CHCC", "PIOC", "MLCF", "KOHC",
  "KAPCO", "KEL", "SNGP", "SSGC", "PRL", "ATRL", "NRL", "CNERGY", "LOTCHEM", "EPCL", "PKGS",
  "BATA", "SRVI", "TGL", "GTYR", "EFOODS", "AVN", "NETSOL", "PTC", "WTL", "KOSM", "GGL", "HASCOL"
  // Add any other KSE tickers here
]);

const STRATEGIES = [
  { value: "DCA", label: "Dollar-Cost Averaging", desc: "Systematic entry in tranches" },
  { value: "SWING", label: "Swing Trading", desc: "Short-term price movements" },
  { value: "VALUE", label: "Value Investing", desc: "Undervalued fundamentals" },
  { value: "GROWTH", label: "Growth Investing", desc: "Long-term capital appreciation" },
  { value: "DIVIDEND", label: "Dividend Income", desc: "Regular yield generation" },
];

const TIMEFRAMES = ["1 Week", "1 Month", "3 Months", "6 Months", "1 Year", "3+ Years"];
const RISK_LEVELS = ["Conservative", "Moderate", "Aggressive"];

// ─── Styles (Unchanged) ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:        #EEE9E0; --surface:   #E8E2D8; --surface2:  #DED7CA; --card:      #F2EDE4;
    --border:    rgba(28,24,16,0.13); --border2:   rgba(28,24,16,0.22);
    --text1:     #1A1714; --text2:     #4A4540; --text3:     #7A736A;
    --green:     #0B6B49; --green2:    #0D8A5E; --green-bg:  #E4F0EB; --green-bd:  rgba(11,107,73,0.25);
    --red:       #8B2020; --red-bg:    #F5E8E8;
    --shadow:    0 1px 3px rgba(28,24,16,0.08), 0 4px 16px rgba(28,24,16,0.06);
    --shadow-sm: 0 1px 2px rgba(28,24,16,0.06);
    --radius:    10px; --radius-lg: 16px;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text1); -webkit-font-smoothing: antialiased; }
  .hdr { background: var(--card); border-bottom: 1px solid var(--border); padding: 0 clamp(16px, 4vw, 48px); height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 200; box-shadow: var(--shadow-sm); }
  .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .logo-mark { width: 32px; height: 32px; background: var(--green); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 16px; letter-spacing: -0.5px; flex-shrink: 0; }
  .logo-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: var(--text1); letter-spacing: -0.3px; }
  .logo-name span { color: var(--green); }
  .hdr-tag { font-size: 11px; font-weight: 500; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text3); background: var(--surface); border: 1px solid var(--border); padding: 5px 12px; border-radius: 20px; }
  .hero { padding: clamp(40px,6vh,72px) clamp(16px,4vw,48px) clamp(28px,4vh,48px); max-width: 860px; margin: 0 auto; }
  .hero-kicker { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--green); margin-bottom: 14px; }
  .hero-kicker::before { content: ''; display: block; width: 18px; height: 2px; background: var(--green); border-radius: 2px; }
  .hero h1 { font-family: 'Playfair Display', serif; font-size: clamp(28px, 5vw, 48px); font-weight: 700; line-height: 1.15; letter-spacing: -0.8px; color: var(--text1); margin-bottom: 14px; }
  .hero h1 em { font-style: italic; color: var(--green); }
  .hero-sub { font-size: clamp(14px, 2vw, 16px); color: var(--text2); line-height: 1.7; max-width: 520px; font-weight: 300; }
  .form-wrap { max-width: 860px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px) 80px; }
  .slabel { font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .slabel-num { width: 18px; height: 18px; background: var(--green-bg); border: 1px solid var(--green-bd); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: var(--green); flex-shrink: 0; }
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
  .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
  .chip { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; min-width: 72px; box-shadow: var(--shadow-sm); }
  .chip:hover { border-color: var(--green2); background: var(--green-bg); }
  .chip.active { background: var(--green-bg); border-color: var(--green); box-shadow: 0 0 0 1px var(--green); }
  .chip-ticker { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: var(--text1); display: block; }
  .chip.active .chip-ticker { color: var(--green); }
  .chip-name { font-size: 9px; color: var(--text3); display: block; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 72px; }
  .input { width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400; color: var(--text1); outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: var(--shadow-sm); }
  .input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(11,107,73,0.1); }
  .input.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(139,32,32,0.1); }
  .input::placeholder { color: var(--text3); }
  .strategy-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; }
  .strat-btn { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 14px 12px; cursor: pointer; text-align: left; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .strat-btn:hover { border-color: var(--green2); background: var(--green-bg); }
  .strat-btn.active { background: var(--green-bg); border-color: var(--green); box-shadow: 0 0 0 1px var(--green); }
  .strat-label { font-size: 13px; font-weight: 600; color: var(--text1); display: block; margin-bottom: 3px; }
  .strat-btn.active .strat-label { color: var(--green); }
  .strat-desc { font-size: 11px; color: var(--text3); line-height: 1.4; display: block; }
  .pill-row { display: flex; flex-wrap: wrap; gap: 7px; }
  .pill { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 7px 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--text2); cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .pill:hover { border-color: var(--green2); color: var(--green); }
  .pill.active { background: var(--green-bg); border-color: var(--green); color: var(--green); font-weight: 600; box-shadow: 0 0 0 1px var(--green); }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .input-group { display: flex; flex-direction: column; gap: 8px; }
  .summary-bar { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 20px; }
  .sum-item { display: flex; align-items: center; gap: 5px; font-size: 12px; }
  .sum-key { color: var(--text3); font-weight: 400; }
  .sum-val { color: var(--text1); font-weight: 600; }
  .sum-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border2); }
  .gen-btn { width: 100%; padding: 16px 24px; background: var(--green); border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 2px 8px rgba(11,107,73,0.25); letter-spacing: 0.1px; }
  .gen-btn:hover:not(:disabled) { background: var(--green2); box-shadow: 0 4px 16px rgba(11,107,73,0.3); transform: translateY(-1px); }
  .gen-btn:active:not(:disabled) { transform: translateY(0); }
  .gen-btn:disabled { background: var(--surface2); color: var(--text3); cursor: not-allowed; box-shadow: none; }
  .loading-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px 32px; text-align: center; box-shadow: var(--shadow); margin-top: 32px; }
  .spinner-ring { width: 40px; height: 40px; border: 3px solid var(--surface2); border-top-color: var(--green); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 14px; color: var(--text2); line-height: 1.6; }
  .loading-steps { display: flex; justify-content: center; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
  .l-step { font-size: 11px; padding: 4px 10px; border-radius: 12px; background: var(--surface); color: var(--text3); border: 1px solid var(--border); }
  .l-step.done { background: var(--green-bg); color: var(--green); border-color: var(--green-bd); }
  .report-wrap { max-width: 860px; margin: 0 auto; padding: clamp(24px,4vh,48px) clamp(16px,4vw,48px) 80px; }
  .report-hdr { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 2px solid var(--border); }
  .rh-left { display: flex; align-items: center; gap: 16px; }
  .rh-ticker { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: var(--green); line-height: 1; letter-spacing: -1px; }
  .rh-meta { display: flex; flex-direction: column; gap: 6px; }
  .rh-name { font-size: 15px; font-weight: 600; color: var(--text1); }
  .rh-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .rh-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 3px 9px; border-radius: 4px; background: var(--green-bg); border: 1px solid var(--green-bd); color: var(--green); }
  .rh-right { text-align: right; }
  .rh-ts { font-size: 11px; color: var(--text3); line-height: 1.7; }
  .rh-ts strong { color: var(--text2); font-weight: 600; }
  .report-body { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: clamp(20px,4vw,40px); box-shadow: var(--shadow); border-top: 3px solid var(--green); }
  .report-body h2 { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--green); margin: 32px 0 10px; display: flex; align-items: center; gap: 10px; }
  .report-body h2:first-child { margin-top: 0; }
  .report-body h2::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .report-body h3 { font-size: 15px; font-weight: 600; color: var(--text1); margin: 18px 0 8px; }
  .report-body p { font-size: 15px; color: var(--text2); line-height: 1.8; margin-bottom: 12px; }
  .report-body strong { color: var(--text1); font-weight: 600; }
  .report-body ul { list-style: none; padding: 0; margin-bottom: 14px; }
  .report-body ul li { font-size: 14px; color: var(--text2); line-height: 1.75; padding: 7px 0 7px 18px; position: relative; border-bottom: 1px solid var(--border); }
  .report-body ul li:last-child { border-bottom: none; }
  .report-body ul li::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 5px; height: 5px; border-radius: 50%; background: var(--green); opacity: 0.6; }
  .verdict-box { background: var(--green-bg); border: 1px solid var(--green-bd); border-left: 3px solid var(--green); border-radius: 8px; padding: 18px 20px; margin-top: 8px; }
  .verdict-box p { color: var(--text1); margin-bottom: 0; }
  .err-box { background: var(--red-bg); border: 1px solid rgba(139,32,32,0.2); border-radius: var(--radius); padding: 16px 18px; font-size: 13px; color: var(--red); margin-top: 16px; display: flex; align-items: flex-start; gap: 10px; }
  .report-actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
  .btn-outline { padding: 11px 22px; background: var(--card); border: 1px solid var(--border2); border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--text1); cursor: pointer; transition: all 0.15s; box-shadow: var(--shadow-sm); }
  .btn-outline:hover { background: var(--surface); border-color: var(--green); color: var(--green); }
  .btn-green { padding: 11px 22px; background: var(--green); border: none; border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.15s; }
  .btn-green:hover { background: var(--green2); }
  .footer { border-top: 1px solid var(--border); padding: 20px clamp(16px,4vw,48px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; background: var(--card); }
  .footer-text { font-size: 12px; color: var(--text3); }
  .footer-disc { font-size: 11px; color: var(--text3); text-align: right; max-width: 420px; line-height: 1.5; }
  @media (max-width: 640px) { .row2 { grid-template-columns: 1fr; gap: 16px; } .strategy-grid { grid-template-columns: 1fr 1fr; } .rh-left { gap: 12px; } .rh-ticker { font-size: 32px; } .report-actions { flex-direction: column; } .btn-outline, .btn-green { width: 100%; text-align: center; } .footer { flex-direction: column; align-items: flex-start; } .footer-disc { text-align: left; max-width: 100%; } }
  @media (max-width: 400px) { .strategy-grid { grid-template-columns: 1fr; } .chip-grid { gap: 6px; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to   { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.4s ease forwards; }
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
  const [ticker, setTicker] = useState("SYS");
  const [custom, setCustom] = useState("");
  const [strategy, setStrategy] = useState("DCA");
  const [timeframe, setTimeframe] = useState("3 Months");
  const [risk, setRisk] = useState("Moderate");
  const [entryPrice, setEntryPrice] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [priceSource, setPriceSource] = useState("");

  // States for Validation
  const [livePrice, setLivePrice] = useState(null);
  const [isValidTicker, setIsValidTicker] = useState(true);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const reportRef = useRef(null);

  const activeTicker = custom.trim().toUpperCase() || ticker;
  const stockData = STOCKS.find(s => s.ticker === activeTicker);
  const stratData = STRATEGIES.find(s => s.value === strategy);
  const finalPrice = manualPrice || livePrice || "";

  const LOAD_STEPS = ["Reading inputs", "Building prompt", "Consulting AI", "Formatting report"];

  // ── 1. Efficient Validation & Price Fetch (Debounced) ──
  useEffect(() => {
    // If user is typing custom ticker, validate it against our O(1) Set
    if (custom) {
      setIsValidTicker(VALID_KSE_TICKERS.has(activeTicker));
    } else {
      setIsValidTicker(true); // Default chips are always valid
    }

    if (!activeTicker || (custom && !VALID_KSE_TICKERS.has(activeTicker))) {
      setLivePrice(null);
      return;
    }

    // Debounce the price fetch so we don't spam your API route
    const fetchTimer = setTimeout(async () => {
      try {
        // NOTE: Uses your existing route setup. 
        // Adjust the URL if your existing backend uses a different path for fetching live prices.
        const res = await fetch(`/api/quote?symbol=${activeTicker}`);
        if (res.ok) {
          const data = await res.json();
          if (data.price) {
            setLivePrice(data.price);
            setPriceSource(data.source || "");
            setError(null);
          } else {
            setLivePrice(null);
            setPriceSource("");
          }
        }
      } catch (err) {
        console.error("Price fetch failed", err);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(fetchTimer);
  }, [activeTicker, custom]);

  // Simulate loading steps
  useEffect(() => {
    if (!loading) { setLoadStep(0); return; }
    const t = setInterval(() => {
      setLoadStep(p => (p < LOAD_STEPS.length - 1 ? p + 1 : p));
    }, 900);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (report && reportRef.current) {
      setTimeout(() => reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [report]);

  // ── 2. Build Prompt (Feeds current price to Claude) ──
  const buildPrompt = () => `You are a Senior PSX Equity Analyst. 
Generate a comprehensive investment analysis report for:
STOCK: ${activeTicker}${stockData ? ` — ${stockData.name} (${stockData.sector} sector)` : ""}
STRATEGY & TIMEFRAME: Apply the ${stratData?.label} analysis strategy targeting a ${timeframe} investment horizon. You must use the best proven analysis models for this strategy.
RISK PROFILE: ${risk}
${finalPrice ? `CURRENT MARKET PRICE: ₨${finalPrice}` : ""}
${entryPrice ? `INVESTOR ENTRY PRICE: ₨${entryPrice}` : ""}
${notes ? `INVESTOR INTENTION/GOAL: ${notes}` : ""}

Ensure the entire report is written in extremely simple, easy-to-understand language.

Use these EXACT section headers (## format):

## 1. EXECUTIVE SUMMARY
- Brief overview of the business.
- Provide a concise thesis based on the current context.

## 2. KSE-100 & MACRO ENVIRONMENT
- Mention the KSE-100 current price explicitly based on the injected context.
- Mention the current Brent Oil prices and Gold (AUXUSD/XAUUSD) prices. Explain briefly how these impact the stock.

## 3. TECHNICAL LEVELS & PRICING
- Provide the exact All-Time High price vs the current market price or Buy Price.
- If an Entry Price was provided (₨${entryPrice}), calculate the current Profit/Loss percentage and provide a targeted "Hold vs. Exit" recommendation based on the entry impact.
- Explicitly list all major Resistances and Supports. Ensure you extract these accurately from the provided Analyst Report Context if available.

## 4. NEWS & CATALYSTS
- Check all the news sources in the provided Context and provide a report containing all the mentioned news sources and references explicitly cited.
- Explain the recent catalysts based on news.

## 5. STRATEGY ANALYSIS (${stratData?.label.toUpperCase()})
- Based solely on the user-selected timeframe (${timeframe}), apply your chosen proven analysis strategy/model to determine viability.

## 6. FINAL VERDICT & SUMMARY
- End the report with a strict bulleted Summary output section.
- Tell the user exactly what price to buy at and if they should pursue it.
- Clearly state BUY, HOLD, or SELL.
`;

  // ── 3. Call Existing Vercel/Claude API ──
  const generate = async () => {
    if (!activeTicker || !isValidTicker || loading) return;
    setLoading(true);
    setError("");
    setReport("");
    setTimestamp(
      new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" }) + " PKT"
    );

    try {
      // Uses your existing Vercel route exactly as it was
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          ticker: activeTicker,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server responded with ${res.status}`);
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
      <header className="hdr">
        <div className="logo">
          <div className="logo-mark">P</div>
          <span className="logo-name">PSX<span>Claw</span></span>
        </div>
        <span className="hdr-tag">KSE-100 AI Analyst</span>
      </header>

      {!report && (
        <>
          <div className="hero fade-up">
            <div className="hero-kicker">AI-Powered Equity Research</div>
            <h1>Institutional-grade<br /><em>PSX analysis.</em></h1>
            <p className="hero-sub">
              Select a stock, pick your strategy, and receive a structured analyst
              report in seconds — no chatbot, no noise. Just clear investment guidance.
            </p>
          </div>

          <div className="form-wrap fade-up">
            <div className="slabel"><span className="slabel-num">1</span>Select Stock</div>
            <div className="chip-grid">
              {STOCKS.map(s => (
                <div
                  key={s.ticker}
                  className={`chip ${ticker === s.ticker && !custom ? "active" : ""}`}
                  onClick={() => { setTicker(s.ticker); setCustom(""); setIsValidTicker(true); }}
                >
                  <span className="chip-ticker">{s.ticker}</span>
                  <span className="chip-name">{s.name}</span>
                </div>
              ))}
            </div>

            {/* Input with visual error state */}
            <input
              className={`input ${!isValidTicker && custom.length > 0 ? "error" : ""}`}
              style={{ marginTop: 10, marginBottom: !isValidTicker && custom ? 4 : 28 }}
              placeholder="Or type any KSE ticker — e.g. KOHC, PAEL, COLG..."
              value={custom}
              onChange={e => setCustom(e.target.value.toUpperCase())}
              maxLength={8}
            />
            {/* Real-time Validation Warning */}
            {!isValidTicker && custom.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginBottom: 24, fontWeight: 500 }}>
                ⚠ Invalid or unrecognised KSE ticker.
              </span>
            )}
            
            {isValidTicker && activeTicker && livePrice && (
              <div style={{ marginBottom: 28, fontSize: 13, color: 'var(--green)', fontWeight: 500, background: 'var(--green-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--green-bd)', display: 'inline-block' }}>
                <span style={{ opacity: 0.8 }}>Live {activeTicker}:</span> ₨{livePrice}
                {priceSource && <span style={{ marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid rgba(0,0,0,0.1)', opacity: 0.6, fontSize: 11 }}>{priceSource}</span>}
              </div>
            )}

            <hr className="section-divider" />

            <div className="slabel" style={{ marginBottom: 12 }}><span className="slabel-num">2</span>Investment Strategy</div>
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

            <div className="row2" style={{ marginBottom: 28 }}>
              <div className="input-group">
                <div className="slabel"><span className="slabel-num">3</span>Investment Horizon</div>
                <div className="pill-row">
                  {TIMEFRAMES.map(t => (
                    <button key={t} className={`pill ${timeframe === t ? "active" : ""}`} onClick={() => setTimeframe(t)}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <div className="slabel"><span className="slabel-num">4</span>Risk Appetite</div>
                <div className="pill-row">
                  {RISK_LEVELS.map(r => (
                    <button key={r} className={`pill ${risk === r ? "active" : ""}`} onClick={() => setRisk(r)}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="section-divider" />

            <div className="row2" style={{ marginBottom: 20 }}>
              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">5</span>Current Price (If inaccurate) &nbsp;
                  <span style={{ color: "var(--text3)", letterSpacing: 0, fontWeight: 400, textTransform: "none" }}>optional</span>
                </div>
                <input 
                  className="input" 
                  type="number"
                  placeholder={livePrice ? `Live: ₨${livePrice}` : "Optional override..."} 
                  value={manualPrice} 
                  onChange={e => setManualPrice(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <div className="slabel">
                  <span className="slabel-num">6</span>Your Entry/Buy Price &nbsp;
                  <span style={{ color: "var(--text3)", letterSpacing: 0, fontWeight: 400, textTransform: "none" }}>optional</span>
                </div>
                <input 
                  className="input" 
                  type="number"
                  placeholder="Price you already paid..." 
                  value={entryPrice} 
                  onChange={e => setEntryPrice(e.target.value)} 
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 28 }}>
              <div className="slabel">
                <span className="slabel-num">7</span>What are you trying to achieve? &nbsp;
                <span style={{ color: "var(--text3)", letterSpacing: 0, fontWeight: 400, textTransform: "none" }}>optional</span>
              </div>
              <input className="input" placeholder="e.g. Trying to find long term compounding compounders..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="summary-bar">
              <div className="sum-item"><span className="sum-key">Stock</span><span className="sum-val">{activeTicker}</span></div>
              <div className="sum-dot" />
              <div className="sum-item"><span className="sum-key">Strategy</span><span className="sum-val">{stratData?.label}</span></div>
              <div className="sum-dot" />
              <div className="sum-item"><span className="sum-key">Horizon</span><span className="sum-val">{timeframe}</span></div>
              <div className="sum-dot" />
              <div className="sum-item"><span className="sum-key">Risk</span><span className="sum-val">{risk}</span></div>
              {finalPrice && (
                <>
                  <div className="sum-dot" />
                  <div className="sum-item"><span className="sum-key">Price</span><span className="sum-val">₨{finalPrice}</span></div>
                </>
              )}
            </div>

            {/* Button disables if the ticker is invalid or API is loading */}
            <button
              className="gen-btn"
              onClick={generate}
              disabled={loading || !activeTicker || !isValidTicker}
            >
              {loading ? (
                <>
                  Analysing {activeTicker}
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </>
              ) : (
                `Generate ${activeTicker} Analysis →`
              )}
            </button>

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

            {error && (
              <div className="err-box fade-up">
                <span>⚠</span>
                <span>{error} — Check your API key and try again.</span>
              </div>
            )}
          </div>
        </>
      )}

      {report && (
        <div className="report-wrap fade-up" ref={reportRef}>
          <div className="report-hdr">
            <div className="rh-left">
              <div className="rh-ticker">{activeTicker}</div>
              <div className="rh-meta">
                <span className="rh-name">{stockData?.name || activeTicker}</span>
                <div className="rh-tags">
                  <span className="rh-tag">{stockData?.sector || "KSE"}</span>
                  <span className="rh-tag">{stratData?.label}</span>
                  <span className="rh-tag">{timeframe}</span>
                  <span className="rh-tag">{risk} risk</span>
                  {finalPrice && <span className="rh-tag">CMP: ₨{finalPrice}</span>}
                  {entryPrice && <span className="rh-tag">Entry: ₨{entryPrice}</span>}
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

          <div className="report-body" dangerouslySetInnerHTML={{ __html: renderReport(report) }} />

          <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 16, lineHeight: 1.6 }}>
            ⚠ This report is generated by AI and is for informational purposes only.
            It does not constitute financial advice. Always do your own research before investing.
          </p>

          <div className="report-actions">
            <button className="btn-outline" onClick={reset}>← New Analysis</button>
            <button className="btn-outline" onClick={() => {
              const text = document.querySelector(".report-body")?.innerText;
              if (text) { navigator.clipboard?.writeText(text); alert("Report copied to clipboard!"); }
            }}>Copy Report</button>
            <button className="btn-outline" onClick={() => window.print()}>Print / Save PDF</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <span className="footer-text">PSXClaw © 2025 — KSE AI Analyst</span>
        <span className="footer-disc">
          For informational use only. Not financial advice.
          Investing in equities involves risk of loss.
        </span>
      </footer>
    </>
  );
}
