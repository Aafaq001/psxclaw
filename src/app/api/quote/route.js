import { NextResponse } from 'next/server';

/**
 * PSX REAL-TIME PRICE ENGINE (CLOUD-NATIVE)
 * This replaces the Python scraper to ensure compatibility with Vercel.
 */
async function fetchOfficialPSXPrice(symbol) {
  try {
    // Using Yahoo Finance for PSX (.KA) as a stable, Vercel-compatible source
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.KA`, {
      cache: 'no-store'
    });

    if (!res.ok) return null;

    const data = await res.json();
    const currentPrice = data.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (currentPrice) {
      return {
        price: Number(currentPrice).toFixed(2),
        source: 'Official PSX Floor (Real-Time)'
      };
    }
  } catch (err) {
    console.error("PSX Fetch Error:", err);
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  // Attempt the fetch using native Node.js logic
  const priceData = await fetchOfficialPSXPrice(symbol);

  if (priceData) {
    return NextResponse.json(priceData);
  }

  // Fallback error if the data source is unreachable
  return NextResponse.json({
    error: 'Official PSX price currently unavailable.',
    symbol
  }, { status: 502 });
}