export const maxDuration = 60; // Extend Vercel Serverless Function timeout to 60s
import { NextResponse } from 'next/server';

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
    
    // Inject News Context if ticker is provided
    let ticker = body.ticker || 'PSX';
    let newsText = await fetchRecentNews(ticker);
    
    if (newsText && body.messages && body.messages.length > 0) {
      let prompt = body.messages[0].content;
      prompt += `\n\n### LATEST REAL-TIME NEWS CATCH:\nThese are the most recent headlines pulled today for this stock/market:\n${newsText}\nKeep this news in mind and weave its impact into your fundamental assessment.`;
      
      prompt += `\n\n### CURRENT DATE CONTEXT:\nToday's exact date is ${new Date().toLocaleDateString('en-US', { timeZone: "Asia/Karachi", dateStyle: "full"})}. All your analysis must treat this as the present day. Ignore the 2023 cutoff.`;
      
      body.messages[0].content = prompt;
    }
    
    // Remove ticker from body as Anthropic API doesn't accept it
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
