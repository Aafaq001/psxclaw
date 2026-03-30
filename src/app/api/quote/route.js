import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  try {
    const yahooSymbol = symbol.toUpperCase() + '.KA';
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/'
      + yahooSymbol
      + '?interval=1m&range=1d';

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store'
    });

    if (!response.ok) throw new Error('Yahoo fetch failed');

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const closes = result.indicators?.quote?.[0]?.close || [];
    const valid = closes.filter(Boolean);
    const price = valid.length > 0
      ? valid[valid.length - 1]
      : result.meta?.regularMarketPrice;

    if (!price) throw new Error('No price');
    return NextResponse.json({ price: Number(price).toFixed(2) });

  } catch (err) {
    const fallback = {
      'SYS': '126.00', 'MEBL': '447.00', 'OGDC': '275.00',
      'PSO': '352.00', 'HBL': '279.00', 'MCB': '361.00',
      'ENGRO': '281.00', 'ENGROH': '281.00', 'LUCK': '367.00',
      'TRG': '90.00', 'MARI': '609.00', 'UBL': '365.00',
      'NESTLE': '7822.00', 'KSE100': '151707.00',
    };
    const f = fallback[symbol.toUpperCase()];
    if (f) return NextResponse.json({ price: f, estimated: true });
    return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
  }
}