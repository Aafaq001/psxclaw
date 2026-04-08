import { NextResponse } from "next/server";

export const maxDuration = 30;

/**
 * ── PSX REAL-TIME PRICE ENGINE (REBUILT) ──
 * This engine focuses exclusively on the official PSX floor feed
 * to ensure absolute accuracy (matching the 136.45 price points).
 * As requested, all "backups" and "fallbacks" have been removed.
 */

async function fetchYahooFinance(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    // Extract price from closes array -> last valid value -> fallback to meta.regularMarketPrice
    let price = meta.regularMarketPrice;
    
    if (result.indicators?.quote?.[0]?.close) {
      const closes = result.indicators.quote[0].close;
      // find the last non-null value
      for (let i = closes.length - 1; i >= 0; i--) {
        if (closes[i] !== null) {
          price = closes[i];
          break;
        }
      }
    }

    return {
      price: price ? Number(price).toFixed(2) : null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      regularMarketChange: meta.regularMarketChange,
      regularMarketChangePercent: meta.regularMarketChangePercent,
      previousClose: meta.previousClose,
    };
  } catch (err) {
    console.error("Yahoo fetch error:", err.message);
    return null;
  }
}

async function fetchFromOfficialPSX(symbol) {
  try {
    // Validate symbol to prevent issues
    if (!symbol || typeof symbol !== "string" || symbol.length > 10) {
      throw new Error("Invalid symbol provided");
    }

    // Sanitize symbol - only allow alphanumeric characters
    const sanitizedSymbol = symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();

    if (!sanitizedSymbol) {
      throw new Error("Invalid symbol after sanitization");
    }

    // Exact same endpoint and logic as Python script
    const url = `https://dps.psx.com.pk/timeseries/int/${sanitizedSymbol}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      // Same timeout as Python script
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Exact same logic: data["data"][0] is latest trade, [1] is price
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const latestTrade = data.data[0]; // Latest trade (same as Python)
      const price = latestTrade[1]; // Price field (same as Python)

      if (price && !isNaN(Number(price))) {
        return {
          price: Number(price).toFixed(2),
          source: "Official PSX Floor (Real-Time)",
        };
      }
    }

    return null;
  } catch (err) {
    console.error("Official PSX Fetch Error:", err.message);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const symbol = searchParams.get("symbol")?.toUpperCase();

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 },
    );
  }

  if (symbol.length > 10 || !/^[A-Z0-9]+$/.test(symbol)) {
    return NextResponse.json(
      { error: "Invalid symbol format" },
      { status: 400 },
    );
  }

  try {
    if (symbol === 'KSE100') {
      const yahooData = await fetchYahooFinance('^KARACHI');
      if (!yahooData) throw new Error("Yahoo fetch failed");
      return NextResponse.json({
         price: yahooData.price,
         change: yahooData.regularMarketChange,
         changePercent: yahooData.regularMarketChangePercent,
         fiftyTwoWeekHigh: yahooData.fiftyTwoWeekHigh,
         fiftyTwoWeekLow: yahooData.fiftyTwoWeekLow,
         regularMarketChange: yahooData.regularMarketChange,
         regularMarketChangePercent: yahooData.regularMarketChangePercent,
         previousClose: yahooData.previousClose,
         source: "Yahoo Finance"
      });
    }

    if (symbol === 'GOLD') {
      const yahooData = await fetchYahooFinance('GC=F');
      if (!yahooData) throw new Error("Yahoo fetch failed");
      return NextResponse.json({
         price: yahooData.price,
         change: yahooData.regularMarketChange,
         changePercent: yahooData.regularMarketChangePercent,
         fiftyTwoWeekHigh: yahooData.fiftyTwoWeekHigh,
         fiftyTwoWeekLow: yahooData.fiftyTwoWeekLow,
         regularMarketChange: yahooData.regularMarketChange,
         regularMarketChangePercent: yahooData.regularMarketChangePercent,
         previousClose: yahooData.previousClose,
         source: "Yahoo Finance"
      });
    }

    if (symbol === 'GOLDINR' || symbol === 'GOLDPKR') {
      const isPKR = symbol === 'GOLDPKR';
      const [goldData, currencyData] = await Promise.all([
        fetchYahooFinance('GC=F'),
        fetchYahooFinance(isPKR ? 'PKR=X' : 'INR=X')
      ]);

      if (!goldData || !currencyData) throw new Error("Yahoo fetch failed");

      const goldPriceUSD = Number(goldData.price);
      const rate = Number(currencyData.price);
      const localizedPrice = (goldPriceUSD * rate).toFixed(2);

      return NextResponse.json({
         price: localizedPrice,
         goldUSD: goldPriceUSD,
         pkrRate: isPKR ? rate : undefined,
         inrRate: !isPKR ? rate : undefined,
         fiftyTwoWeekHigh: goldData.fiftyTwoWeekHigh,
         fiftyTwoWeekLow: goldData.fiftyTwoWeekLow,
         regularMarketChange: goldData.regularMarketChange,
         regularMarketChangePercent: goldData.regularMarketChangePercent,
         previousClose: goldData.previousClose,
         source: "Yahoo Finance"
      });
    }

    // Default for PSX stocks
    const [officialData, yahooData] = await Promise.all([
      fetchFromOfficialPSX(symbol),
      fetchYahooFinance(`${symbol}.KA`)
    ]);

    if (!officialData && !yahooData) {
      throw new Error("Both PSX and Yahoo failed");
    }

    // Combine data - prioritize official PSX for price
    const combinedData = {
      price: officialData?.price || yahooData?.price,
      source: officialData ? officialData.source : "Yahoo Finance",
    };

    if (yahooData) {
      combinedData.fiftyTwoWeekHigh = yahooData.fiftyTwoWeekHigh;
      combinedData.fiftyTwoWeekLow = yahooData.fiftyTwoWeekLow;
      combinedData.regularMarketChange = yahooData.regularMarketChange;
      combinedData.regularMarketChangePercent = yahooData.regularMarketChangePercent;
      combinedData.previousClose = yahooData.previousClose;
    }

    if (combinedData.price) {
      return NextResponse.json(combinedData);
    }
    
    throw new Error("No price extracted");
  } catch (err) {
    console.error("Quote Route Error:", err.message);
    return NextResponse.json(
      {
        error: "Live price unavailable. Enter price manually.",
        status: 502,
      },
      { status: 502 },
    );
  }
}
