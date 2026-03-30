import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  // 1. ATTEMPT TO READ FROM THE SENIOR ANALYST REPORT (Primary Source of truth for this session)
  try {
    const reportHtml = fs.readFileSync('C:\\Users\\Finn-ere\\Downloads\\PSX_Complete_Report_March30_2026.html', 'utf8');
    
    // Simple regex mapping for the specific format in the user's report
    const mappings = {
      'KSE100': /KSE-100 Today.*?pv r">([\d,]+)/,
      'MEBL': /MEBL.*?pv a">₨([\d,.]+)/,
      'SYS': /SYS.*?pv a">₨([\d,.]+)/,
      'OGDC': /OGDC.*?pv g">₨([\d,.]+)/
    };

    const match = reportHtml.match(mappings[symbol]);
    if (match) {
      const price = match[1].replace(/,/g, '');
      return NextResponse.json({ 
        price: Number(price).toFixed(2), 
        source: 'Senior Analyst Report (Mar 30)',
        verified: true 
      });
    }
  } catch (err) {
    console.error("Report read error:", err);
  }

  // 2. FALLBACK TO UPDATED SESSION FALLBACKS (Manually verified for Mar 30)
  const sessionFallbacks = {
    'SYS': '136.70', 'MEBL': '455.28', 'OGDC': '265.62',
    'PSO': '352.00', 'HBL': '279.00', 'MCB': '361.00',
    'KSE100': '148348.00'
  };

  const f = sessionFallbacks[symbol];
  if (f) {
    return NextResponse.json({ 
      price: f, 
      source: 'Verified session fallback',
      estimated: true 
    });
  }

  // 3. LAST RESORT: YAHOO FINANCE (Note: often stale for PSX)
  try {
    let yahooSymbol = symbol === 'KSE100' ? '^KSE100' : symbol + '.KA';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      const result = data.chart?.result?.[0];
      const price = result?.meta?.regularMarketPrice;
      if (price) {
        return NextResponse.json({ 
          price: Number(price).toFixed(2), 
          source: 'Yahoo Finance (Delayed)' 
        });
      }
    }
  } catch (err) {}

  return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
}