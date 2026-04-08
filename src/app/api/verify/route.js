import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req) {
  try {
    const body = await req.json();
    const { ticker, livePrice, fiftyTwoWeekHigh, fiftyTwoWeekLow, previousClose, sector } = body;

    const prompt = `You are a PSX data verification agent. Your job is to sanity-check price data before it enters an analyst report.

TICKER: ${ticker}
LIVE PRICE: ₨${livePrice}
52-WEEK HIGH: ₨${fiftyTwoWeekHigh}
52-WEEK LOW: ₨${fiftyTwoWeekLow}
PREVIOUS CLOSE: ₨${previousClose}
SECTOR: ${sector}

Cross-check this data using your knowledge of PSX stocks as of early 2026.

Return ONLY valid JSON, no other text:
{
  "priceRangeValid": true or false,
  "weekHighLowValid": true or false,
  "suspiciousFlags": [],
  "confirmedATH_approx": "your best estimate of all-time high for this stock",
  "confirmedATL_approx": "your best estimate of all-time low for this stock",
  "priceContext": "one sentence — where is this price relative to 52-week range",
  "dataConfidence": "High / Medium / Low",
  "notes": "any concerns about the data accuracy"
}

If 52-week high is lower than live price, flag it.
If 52-week low is higher than live price, flag it.
If the price seems impossibly far from known ranges, flag it.
Use your knowledge to estimate realistic ATH and ATL for this ticker.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }]
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("[Anthropic API Error]:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const text = data.content?.[0]?.text || "{}";
    
    // Attempt to parse JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       throw new Error("Failed to parse JSON from verification agent.");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
