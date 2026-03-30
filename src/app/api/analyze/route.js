export const maxDuration = 60;
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path'; // Path is essential for Linux/Vercel

async function fetchBrentPrice() {
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F', { cache: 'no-store' });
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ? `$${price.toFixed(2)}` : "Unknown";
  } catch (e) { return "Unknown"; }
}

async function fetchXAUUSDPrice() {
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F', { cache: 'no-store' });
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price ? `$${price.toFixed(2)}` : "Unknown";
  } catch (e) { return "Unknown"; }
}

async function fetchRecentNews(ticker) {
  try {
    const query = encodeURIComponent(`${ticker} Pakistan Stock Exchange`);
    const res = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-PK&gl=PK&ceid=PK:en`, { next: { revalidate: 3600 } });
    const xml = await res.text();
    const items = xml.split('<item>').slice(1, 4);
    let newsList = "";
    items.forEach((item) => {
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      if (titleMatch) {
        let title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        newsList += `- ${title} (${pubDateMatch ? pubDateMatch[1] : ""})\n`;
      }
    });
    return newsList;
  } catch (e) { return ""; }
}

export async function POST(req) {
  try {
    const body = await req.json();
    let ticker = body.ticker || 'PSX';

    // Fetch data in parallel for speed
    const [newsText, brentPrice, xauPrice] = await Promise.all([
      fetchRecentNews(ticker),
      fetchBrentPrice(),
      fetchXAUUSDPrice()
    ]);

    // --- CLOUD-NATIVE FILE PATHING ---
    let reportText = "";
    try {
      // process.cwd() points to the project root on Vercel
      const filePath = path.join(process.cwd(), 'scripts', 'PSX_Complete_Report_March30_2026.html');
      const reportHtml = fs.readFileSync(filePath, 'utf8');
      reportText = reportHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    } catch (err) {
      console.error("File Read Error:", err);
      reportText = "Report data temporarily unavailable.";
    }

    if (body.messages && body.messages.length > 0) {
      let prompt = body.messages[0].content;
      prompt += `\n\n### LIVE DATA:\n- BRENT: ${brentPrice}\n- GOLD: ${xauPrice}\n- DATE: ${new Date().toLocaleDateString('en-US', { timeZone: "Asia/Karachi" })}\n`;
      if (newsText) prompt += `\n### LATEST NEWS:\n${newsText}\n`;
      prompt += `\n### ANALYST REPORT CONTEXT:\n${reportText}\n`;
      body.messages[0].content = prompt;
    }

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
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}