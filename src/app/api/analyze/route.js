export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60s
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

async function fetchBrentPrice() {
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F', { cache: 'no-store' });
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
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F', { cache: 'no-store' });
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
    const res = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return "";
    const xml = await res.text();

    // Simple regex to extract titles
    const items = xml.split('<item>').slice(1, 4); // top 3
    let newsList = "";
    items.forEach((item, index) => {
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      if (titleMatch) {
        let title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
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

    let ticker = body.ticker || 'PSX';
    let newsText = await fetchRecentNews(ticker);
    let brentPrice = await fetchBrentPrice();
    let xauPrice = await fetchXAUUSDPrice();

    // Read static HTML report
    let reportText = "";
    try {
      const filePath = path.join(process.cwd(), 'scripts', 'PSX_Complete_Report_March30_2026.html');
      const reportHtml = fs.readFileSync(filePath, 'utf8');
      // Extremely basic regex to strip HTML tags and squish spaces
      reportText = reportHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch (err) {
      console.error("Error reading PSX report file:", err);
      reportText = "No local report data available.";
    }

    if (body.messages && body.messages.length > 0) {
      let prompt = body.messages[0].content;

      prompt += `\n\n### LIVE MACRO DATA:\n- CURRENT BRENT CRUDE OIL PRICE: ${brentPrice}\n- CURRENT GOLD (AUXUSD/XAUUSD) PRICE: ${xauPrice}\n- DATE: ${new Date().toLocaleDateString('en-US', { timeZone: "Asia/Karachi", dateStyle: "full" })}\n- TIME: ${new Date().toLocaleTimeString('en-US', { timeZone: "Asia/Karachi", hour12: false })}\n`;

      if (newsText) {
        prompt += `\n### LATEST REAL-TIME NEWS (Google News):\nThese are the most recent headlines pulled for ${ticker}:\n${newsText}\n`;
      }

      prompt += `\n### REQUIRED CONTEXT (March 30, 2026 ANALYST REPORT):\nThe following is raw text from an internal firm report containing explicit market details, KSE-100 context, news sources, and technical levels. You MUST extract any news sources mentioned here and explicitly cite them. You MUST mention the current KSE-100 level mentioned in this report. You MUST use support/resistance levels and buy prices provided here. Prioritize this information above all else:\n<report_text>\n${reportText}\n</report_text>\n`;

      body.messages[0].content = prompt;
    }

    delete body.ticker;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) {
      console.error("[Anthropic API Error]:", data.error);
      return NextResponse.json({ error: data.error.message || "Anthropic API Error" }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
