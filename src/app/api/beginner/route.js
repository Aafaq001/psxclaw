export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60s

import { NextResponse } from "next/server";

/**
 * Robust fetch with model fallback for Groq API (Free Llama 3)
 */
async function fetchAIWithFallback(messages, maxTokens = 1200) {
  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct"
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[AI Beginner] Attempting Groq request with model: ${model}`);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          messages: messages,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { 
          data: {
            content: [{ text: data.choices[0].message.content }]
          }, 
          modelUsed: model 
        };
      }

      console.warn(`[AI Beginner Fallback] Model ${model} failed: ${data.error?.message || response.statusText}. Trying next...`);
      lastError = data.error;
      continue; 

    } catch (err) {
      console.error(`[AI Beginner Fallback Error] Exception during Groq fetch for ${model}:`, err);
      lastError = err;
    }
  }

  return { error: lastError || { message: "All Groq models failed" }, status: 500 };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { budget, goal, riskComfort, horizon } = body;

    const todayDate = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Karachi", dateStyle: "full" });

    const systemPrompt = `You are a friendly, patient PSX investment advisor helping a complete beginner invest in Pakistan's stock market for the first time.
Today is ${todayDate}.
The KSE-100 is currently at approximately 151,000 points.

The user's profile:
- Budget: ${budget}
- Goal: ${goal}
- Risk comfort: ${riskComfort}
- Time horizon: ${horizon}

Write a beginner-friendly investment guide using these EXACT sections:

## WHAT IS PSX AND WHY INVEST?
2-3 sentences. Simple language. No jargon. Explain like they are 20 years old and this is their first time hearing about stocks.

## CURRENT MARKET SNAPSHOT
What is happening in Pakistan's stock market right now (April 2026)?
Mention: KSE-100 level, whether it's a good or bad time to enter, key factors affecting the market (SBP rate, IMF, oil prices, Middle East).
Write in plain Urdu-English mixed tone that Pakistani readers relate to.

## YOUR PERSONALISED STRATEGY
Based on their exact budget and goal, recommend ONE of these approaches:
  A) If budget under ₨25,000 or risk-averse: Recommend starting with a mutual fund (mention NIT, MCB DCF, or Meezan Islamic Fund by name) instead of direct stocks. Explain why this is safer for beginners.
  B) If budget ₨25,000–500,000 and moderate: Recommend 2-3 specific blue-chip stocks suitable for their goal. Explain each in one sentence.
  C) If budget over ₨500,000 and growth-oriented: Recommend a mini portfolio split across 3-4 sectors with specific tickers and % allocation.

## HOW TO ACTUALLY BUY SHARES IN PAKISTAN
Step by step:
1. Open a CDC account through a SECP-registered broker (mention: Meezan Bank brokerage, JS Global, Arif Habib)
2. Minimum starting amount
3. How to place your first order
4. Tax advantage: capital gains tax-free after 2 years of holding

## WHAT TO WATCH OUT FOR
3 bullets. Common beginner mistakes in Pakistani market context.
Example: panic selling during political news, investing borrowed money, not diversifying across sectors.

## YOUR FIRST STEP THIS WEEK
One single actionable instruction. Specific. Encouraging. 1-2 sentences.

Tone: Warm, encouraging, simple. Like a knowledgeable friend explaining over chai. No condescension. Avoid all financial jargon without explanation. Keep total length under 700 words.`;

    const result = await fetchAIWithFallback([{ role: "user", content: systemPrompt }], 1200);

    if (result.error) {
      console.error("[Groq Beginner Error]:", result.error);
      return NextResponse.json(
        { error: result.error ? `${result.error.type || "Error"}: ${result.error.message || "Request failed"}` : "Fallback failed" },
        { status: result.status || 400 }
      );
    }

    const data = result.data;
    data.modelUsed = result.modelUsed;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Beginner route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
