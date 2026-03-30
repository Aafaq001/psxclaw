import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

/**
 * ── PSX REAL-TIME PRICE ENGINE (REBUILT) ──
 * This engine focuses exclusively on the official PSX floor feed
 * to ensure absolute accuracy (matching the 136.45 price points).
 * As requested, all "backups" and "fallbacks" have been removed.
 */

function fetchFromOfficialPSX(symbol) {
  try {
    // We use the Python scraper which is optimized for the timeseries JSON extraction
    const command = `python scripts/psx_scraper.py ${symbol}`;
    const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
    const data = JSON.parse(output);

    if (data && data.price) {
      return {
        price: Number(data.price).toFixed(2),
        source: 'Official PSX Floor (Real-Time)'
      };
    }
  } catch (err) {
    console.error("Official PSX Fetch Error:", err);
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'PSX';

  try {
    // 1. Determine the base URL (Vercel uses HTTPS)
    const host = request.headers.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

    // 2. Fetch from your NEW Python API endpoint
    const response = await fetch(`${protocol}://${host}/api/python/psx_scraper?symbol=${symbol}`);
    const data = await response.json();

    if (data && data.price) {
      return NextResponse.json({
        price: data.price,
        source: 'Official PSX Floor (Real-Time)'
      });
    }
  } catch (err) {
    console.error("Official PSX price currently unavailable. Please check the PSX Data Portal manually.:", err);
  }
}
