export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60s

import { NextResponse } from "next/server";

import fs from "fs";

async function fetchBrentPrice() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F",
      { cache: "no-store" },
    );

    if (!res.ok) return "Unknown";

    const data = await res.json();

    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;

    return price ? `$${price.toFixed(2)}` : "Unknown";
  } catch (e) {
    console.error("Brent fetch error", e);

    return "Unknown";
  }
}

async function fetchXAUUSDPrice() {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/GC=F",
      { cache: "no-store" },
    );

    if (!res.ok) return "Unknown";

    const data = await res.json();

    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;

    return price ? `$${price.toFixed(2)}` : "Unknown";
  } catch (e) {
    console.error("XAU fetch error", e);

    return "Unknown";
  }
}

async function fetchRecentNews(ticker) {
  try {
    const query = encodeURIComponent(`${ticker} Pakistan Stock Exchange`);

    const res = await fetch(
      `https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`,
      {
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) return "";

    const xml = await res.text();

    // Simple regex to extract titles

    const items = xml.split("<item>").slice(1, 4); // top 3

    let newsList = "";

    items.forEach((item, index) => {
      const titleMatch = item.match(/<title>(.*?)<\/title>/);

      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);

      if (titleMatch) {
        let title = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"');

        let date = pubDateMatch ? pubDateMatch[1] : "";

        newsList += `- ${title} (${date})\n`;
      }
    });

    return newsList;
  } catch (e) {
    console.error("News fetch error", e);

    return "";
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    let ticker = (body.ticker || "PSX").toString().toUpperCase();

    // STEP 1 - Fetch live price data & Macro/News
    const baseUrl = new URL(req.url).origin;
    
    let newsText = "";
    let brentPrice = "";
    let xauPrice = "";
    let quoteData = null;

    try {
      const [newsRes, brentRes, xauRes, quoteRes] = await Promise.all([
        fetchRecentNews(ticker),
        fetchBrentPrice(),
        fetchXAUUSDPrice(),
        fetch(`${baseUrl}/api/quote?symbol=${encodeURIComponent(ticker)}`)
      ]);
      newsText = newsRes;
      brentPrice = brentRes;
      xauPrice = xauRes;
      if (quoteRes.ok) {
        quoteData = await quoteRes.json();
      }
    } catch (err) {
      console.error("Parallel fetch failed for Step 1:", err);
    }

    // STEP 2 - Verify data
    let verifiedData = null;
    if (quoteData && quoteData.price) {
      try {
        const verifyRes = await fetch(`${baseUrl}/api/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker,
            livePrice: quoteData.price,
            fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
            previousClose: quoteData.previousClose,
            sector: "Unknown"
          })
        });
        if (verifyRes.ok) {
          const verifyJson = await verifyRes.json();
          verifiedData = {
            livePrice: quoteData.price,
            fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
            previousClose: quoteData.previousClose,
            regularMarketChange: quoteData.regularMarketChange,
            regularMarketChangePercent: quoteData.regularMarketChangePercent,
            ...verifyJson
          };
        }
      } catch (err) {
        console.error("Verification failed:", err);
      }
    }

    // Read static HTML report
    let reportText = "";
    try {
      const reportHtml = fs.readFileSync(
        "PSX_Complete_Report_March30_2026.html",
        "utf8",
      );
      reportText = reportHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, " ")
        .trim();
    } catch (err) {
      console.error("Error reading PSX report file:", err);
      reportText = "No local report data available.";
    }

    const runAgent = async (promptMsg) => {
      const agentRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: body.model || "claude-3-5-sonnet-20241022",
          max_tokens: 800,
          messages: [{ role: "user", content: promptMsg }],
        }),
      });
      const agentData = await agentRes.json();
      return agentData.content?.[0]?.text || "";
    };

    // STEP 3 - Run Bull + Bear agents in parallel
    const sharedContext = `
### LIVE MACRO DATA:
- CURRENT BRENT CRUDE OIL PRICE: ${brentPrice}
- CURRENT GOLD (AUXUSD/XAUUSD) PRICE: ${xauPrice}
- DATE: ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Karachi", dateStyle: "full" })}
- TIME: ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Karachi", hour12: false })}

${newsText ? `### LATEST REAL-TIME NEWS (Google News):\n${newsText}\n` : ""}

${verifiedData ? `
### VERIFIED PRICE DATA (cross-checked):
Current Price: ₨${verifiedData.livePrice} (${verifiedData.regularMarketChangePercent}% today)
52-Week High: ₨${verifiedData.fiftyTwoWeekHigh}
52-Week Low: ₨${verifiedData.fiftyTwoWeekLow}
Estimated All-Time High: ${verifiedData.confirmedATH_approx}
Estimated All-Time Low: ${verifiedData.confirmedATL_approx}
Price Context: ${verifiedData.priceContext}
Data Confidence: ${verifiedData.dataConfidence}
${verifiedData.suspiciousFlags?.length > 0 ? `Data flags: ${verifiedData.suspiciousFlags.join(", ")}` : ""}
` : ""}

### CONTEXT REPORT (March 30, 2026 ANALYST REPORT):
<report_text>\n${reportText}\n</report_text>
`;

    const bullPrompt = `You are a Bull Analyst for the PSX analyzing ${ticker}. Make a positive/optimistic case based on the provided context.\n${sharedContext}`;
    const bearPrompt = `You are a Bear Analyst for the PSX analyzing ${ticker}. Make a negative/cautious case based on the provided context.\n${sharedContext}`;

    const [bullOutput, bearOutput] = await Promise.all([
      runAgent(bullPrompt),
      runAgent(bearPrompt)
    ]);

    // STEP 4 - Run Synthesiser agent
    let prompt = body.messages?.[0]?.content || "";
    prompt += `\n\n${sharedContext}`;
    
    if (verifiedData) {
      prompt += `\nUse these VERIFIED figures in your report. Do NOT use different ATH/ATL figures — these have been cross-checked. When citing the 52-week range, use exactly the numbers above.`;
      if (verifiedData.dataConfidence === "Low") {
        prompt += `\nIf dataConfidence is Low, add this line EXACTLY to the report's EXECUTIVE SUMMARY section:\n"⚠ Note: Some price data could not be fully verified. Treat technical levels as approximate."`;
      }
    }

    prompt += `\n\n### BULL ANALYST PERSPECTIVE:\n${bullOutput}\n\n### BEAR ANALYST PERSPECTIVE:\n${bearOutput}\n\nSynthesise all of this into the final report format as requested earlier. Ensure you answer everything asked in the original prompt.`;

    body.messages[0].content = prompt;
    delete body.ticker;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Anthropic API Error]:", data.error);
      return NextResponse.json(
        { error: data.error.message || "Anthropic API Error" },
        { status: 400 },
      );
    }
    
    // Attach verifiedData to the response so the frontend can use it in the UI
    data.verifiedData = verifiedData;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
