export type MarketTimeframe = '1D' | '7D' | '1M' | '1Y' | 'All';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'offline';

export interface TradingPairInfo {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

export interface Ticker24hData {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  tradeCount: number;
  updatedAt: number;
  source: 'live' | 'rest';
}

export interface RawKline {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  tradeCount: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

export interface ChartCandlePoint {
  index: number;
  openTime: number;
  closeTime: number;
  time: string;
  axisLabel?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  ma7?: number;
  ema20?: number;
}

export interface VolumeBucketBar {
  label: string;
  buy: number;
  sell: number;
  total: number;
  txns: number;
}

export interface LiveVolumeSummary {
  txns: number;
  quoteVolume: number;
  netBuyQuote: number;
  bars: VolumeBucketBar[];
  updatedAt: number;
}

const REST_BASE = 'https://data-api.binance.vision';
const WS_BASE = 'wss://data-stream.binance.vision/ws';

// Popular pairs prioritized at top of search suggestions before alphabetical match
const PRIORITY_PAIRS = [
  'SUIUSDT',
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'UNIUSDT',
  'ARBUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'AVAXUSDT',
  'LINKUSDT',
];

let cachedPairs: TradingPairInfo[] | null = null;
let pairsPromise: Promise<TradingPairInfo[]> | null = null;

function toPositiveNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export function extractBaseAsset(pair: string): string {
  const quotes = ['USDT', 'FDUSD', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB'];
  for (const q of quotes) {
    if (pair.endsWith(q) && pair.length > q.length) {
      return pair.slice(0, pair.length - q.length);
    }
  }
  return pair;
}

export function extractQuoteAsset(pair: string): string {
  const quotes = ['USDT', 'FDUSD', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB'];
  for (const q of quotes) {
    if (pair.endsWith(q) && pair.length > q.length) {
      return q;
    }
  }
  return 'USDT';
}

async function fetchJsonWithValidation(
  url: string,
  signal?: AbortSignal
): Promise<unknown> {
  const res = await fetch(url, { signal });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from Binance API (${res.status})`);
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'msg' in parsed
        ? String((parsed as { msg: unknown }).msg)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return parsed;
}

export async function fetchExchangePairs(
  signal?: AbortSignal
): Promise<TradingPairInfo[]> {
  if (cachedPairs) return cachedPairs;
  if (pairsPromise) return pairsPromise;

  pairsPromise = (async () => {
    const raw = await fetchJsonWithValidation(
      `${REST_BASE}/api/v3/exchangeInfo?permissions=SPOT`,
      signal
    );

    if (
      typeof raw !== 'object' ||
      raw === null ||
      !Array.isArray((raw as { symbols?: unknown }).symbols)
    ) {
      throw new Error('Unexpected Binance exchangeInfo payload');
    }

    const symbolsRaw = (raw as { symbols: unknown[] }).symbols;
    const list: TradingPairInfo[] = [];

    for (const item of symbolsRaw) {
      if (typeof item !== 'object' || item === null) continue;
      const s = item as {
        symbol?: unknown;
        baseAsset?: unknown;
        quoteAsset?: unknown;
        status?: unknown;
      };
      if (
        s.status === 'TRADING' &&
        typeof s.symbol === 'string' &&
        typeof s.baseAsset === 'string' &&
        typeof s.quoteAsset === 'string' &&
        (s.quoteAsset === 'USDT' || s.quoteAsset === 'USDC' || s.quoteAsset === 'FDUSD')
      ) {
        list.push({
          pair: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          status: s.status,
        });
      }
    }

    list.sort((a, b) => {
      const aPrio = PRIORITY_PAIRS.indexOf(a.pair);
      const bPrio = PRIORITY_PAIRS.indexOf(b.pair);
      if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio;
      if (aPrio !== -1) return -1;
      if (bPrio !== -1) return 1;
      if (a.quoteAsset === 'USDT' && b.quoteAsset !== 'USDT') return -1;
      if (a.quoteAsset !== 'USDT' && b.quoteAsset === 'USDT') return 1;
      return a.pair.localeCompare(b.pair);
    });

    cachedPairs = list;
    return list;
  })().finally(() => {
    pairsPromise = null;
  });

  return pairsPromise;
}

export async function fetchTicker24hr(
  pair: string,
  signal?: AbortSignal
): Promise<Ticker24hData> {
  const cleanPair = pair.toUpperCase().trim();
  const raw = await fetchJsonWithValidation(
    `${REST_BASE}/api/v3/ticker/24hr?symbol=${encodeURIComponent(cleanPair)}`,
    signal
  );

  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Invalid 24hr ticker payload for ${cleanPair}`);
  }

  const t = raw as Record<string, unknown>;
  const price = Number(t.lastPrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Unavailable price for ${cleanPair}`);
  }

  return {
    pair: cleanPair,
    baseAsset: extractBaseAsset(cleanPair),
    quoteAsset: extractQuoteAsset(cleanPair),
    price,
    priceChange: toPositiveNum(t.priceChange),
    priceChangePercent: toPositiveNum(t.priceChangePercent),
    highPrice: toPositiveNum(t.highPrice, price),
    lowPrice: toPositiveNum(t.lowPrice, price),
    volume: toPositiveNum(t.volume),
    quoteVolume: toPositiveNum(t.quoteVolume),
    tradeCount: Math.max(0, Math.round(toPositiveNum(t.count))),
    updatedAt: Date.now(),
    source: 'rest',
  };
}

export async function fetchLatestPrice(
  pair: string,
  signal?: AbortSignal
): Promise<number> {
  const cleanPair = pair.toUpperCase().trim();
  const raw = await fetchJsonWithValidation(
    `${REST_BASE}/api/v3/ticker/price?symbol=${encodeURIComponent(cleanPair)}`,
    signal
  );
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Invalid price response for ${cleanPair}`);
  }
  const p = Number((raw as { price?: unknown }).price);
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error(`Invalid price value for ${cleanPair}`);
  }
  return p;
}

function parseRawKlines(raw: unknown): RawKline[] {
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected Binance klines payload');
  }
  const parsed: RawKline[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 11) continue;
    const openTime = Number(row[0]);
    const open = Number(row[1]);
    const high = Number(row[2]);
    const low = Number(row[3]);
    const close = Number(row[4]);
    const volume = Number(row[5]);
    const closeTime = Number(row[6]);
    const quoteVolume = Number(row[7]);
    const tradeCount = Number(row[8]);
    const takerBuyBaseVolume = Number(row[9]);
    const takerBuyQuoteVolume = Number(row[10]);

    if (
      !Number.isFinite(openTime) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
    ) {
      continue;
    }

    parsed.push({
      openTime,
      closeTime: Number.isFinite(closeTime) ? closeTime : openTime,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(volume) ? volume : 0,
      quoteVolume: Number.isFinite(quoteVolume) ? quoteVolume : 0,
      tradeCount: Number.isFinite(tradeCount) ? tradeCount : 0,
      takerBuyBaseVolume: Number.isFinite(takerBuyBaseVolume) ? takerBuyBaseVolume : 0,
      takerBuyQuoteVolume: Number.isFinite(takerBuyQuoteVolume) ? takerBuyQuoteVolume : 0,
    });
  }
  return parsed;
}

interface TimeframeFetchPlan {
  interval: string;
  limitPerPage: number;
  maxPages: number;
  bucketSize: number;
}

const TIMEFRAME_PLANS: Record<MarketTimeframe, TimeframeFetchPlan> = {
  '1D': { interval: '15m', limitPerPage: 96, maxPages: 1, bucketSize: 1 },
  '7D': { interval: '2h', limitPerPage: 84, maxPages: 1, bucketSize: 1 },
  '1M': { interval: '1h', limitPerPage: 500, maxPages: 1, bucketSize: 6 },
  '1Y': { interval: '1d', limitPerPage: 365, maxPages: 1, bucketSize: 4 },
  All: { interval: '1w', limitPerPage: 500, maxPages: 2, bucketSize: 2 },
};

function formatTimeLabel(ts: number, timeframe: MarketTimeframe): string {
  const d = new Date(ts);
  if (timeframe === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (timeframe === '7D' || timeframe === '1M') {
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatAxisTick(ts: number, timeframe: MarketTimeframe): string {
  const d = new Date(ts);
  if (timeframe === '1D') {
    return d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase().replace(' ', '');
  }
  if (timeframe === '7D' || timeframe === '1M') {
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }
  if (timeframe === '1Y') {
    return d.toLocaleDateString([], { month: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

export function buildChartCandles(
  rawKlines: RawKline[],
  timeframe: MarketTimeframe
): ChartCandlePoint[] {
  if (rawKlines.length === 0) return [];
  const plan = TIMEFRAME_PLANS[timeframe];
  const step = Math.max(1, plan.bucketSize);

  const grouped: RawKline[] = [];
  if (step === 1 || rawKlines.length <= 96) {
    grouped.push(...rawKlines);
  } else {
    for (let i = 0; i < rawKlines.length; i += step) {
      const slice = rawKlines.slice(i, i + step);
      if (slice.length === 0) continue;
      grouped.push({
        openTime: slice[0].openTime,
        closeTime: slice[slice.length - 1].closeTime,
        open: slice[0].open,
        high: Math.max(...slice.map((k) => k.high)),
        low: Math.min(...slice.map((k) => k.low)),
        close: slice[slice.length - 1].close,
        volume: slice.reduce((acc, k) => acc + k.volume, 0),
        quoteVolume: slice.reduce((acc, k) => acc + k.quoteVolume, 0),
        tradeCount: slice.reduce((acc, k) => acc + k.tradeCount, 0),
        takerBuyBaseVolume: slice.reduce((acc, k) => acc + k.takerBuyBaseVolume, 0),
        takerBuyQuoteVolume: slice.reduce((acc, k) => acc + k.takerBuyQuoteVolume, 0),
      });
    }
  }

  // Place 6 evenly spaced axis labels across the chart
  const tickIndices = new Set<number>();
  const labelCount = Math.min(6, grouped.length);
  if (labelCount > 1) {
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / (labelCount - 1)) * (grouped.length - 1));
      tickIndices.add(idx);
    }
  } else if (grouped.length === 1) {
    tickIndices.add(0);
  }

  let ema = grouped[0].close;
  const k = 2 / (20 + 1);

  return grouped.map((c, idx) => {
    const start = Math.max(0, idx - 6);
    const maSlice = grouped.slice(start, idx + 1);
    const ma7 = maSlice.reduce((sum, item) => sum + item.close, 0) / maSlice.length;
    ema = c.close * k + ema * (1 - k);

    return {
      index: idx,
      openTime: c.openTime,
      closeTime: c.closeTime,
      time: formatTimeLabel(c.openTime, timeframe),
      axisLabel: tickIndices.has(idx) ? formatAxisTick(c.openTime, timeframe) : undefined,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      quoteVolume: c.quoteVolume,
      ma7,
      ema20: ema,
    };
  });
}

export function buildVolumeSummary(
  rawKlines: RawKline[],
  timeframe: MarketTimeframe
): LiveVolumeSummary {
  const txns = rawKlines.reduce((sum, k) => sum + k.tradeCount, 0);
  const quoteVolume = rawKlines.reduce((sum, k) => sum + k.quoteVolume, 0);
  const buyQuoteTotal = rawKlines.reduce((sum, k) => sum + k.takerBuyQuoteVolume, 0);
  const sellQuoteTotal = Math.max(0, quoteVolume - buyQuoteTotal);
  const netBuyQuote = buyQuoteTotal - sellQuoteTotal;

  // Group into 5 clean chronological buckets matching the 5-group bar layout
  const numBuckets = 5;
  const bars: VolumeBucketBar[] = [];
  if (rawKlines.length > 0) {
    const chunkSize = Math.max(1, Math.ceil(rawKlines.length / numBuckets));
    for (let i = 0; i < rawKlines.length; i += chunkSize) {
      const slice = rawKlines.slice(i, i + chunkSize);
      if (slice.length === 0) continue;
      const qVol = slice.reduce((acc, k) => acc + k.quoteVolume, 0);
      const buyQ = slice.reduce((acc, k) => acc + k.takerBuyQuoteVolume, 0);
      const sellQ = Math.max(0, qVol - buyQ);
      const bucketTrades = slice.reduce((acc, k) => acc + k.tradeCount, 0);
      const d = new Date(slice[0].openTime);
      const label =
        timeframe === '1D'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : timeframe === '1Y' || timeframe === 'All'
            ? d.toLocaleDateString([], { month: 'short', year: '2-digit' })
            : d.toLocaleDateString([], { day: 'numeric', month: 'short' });

      bars.push({
        label,
        buy: Math.round(buyQ),
        sell: Math.round(sellQ),
        total: Math.round(qVol),
        txns: bucketTrades,
      });
    }
  }

  return {
    txns,
    quoteVolume,
    netBuyQuote,
    bars: bars.slice(-5),
    updatedAt: Date.now(),
  };
}

export async function fetchHistoricalKlines(
  pair: string,
  timeframe: MarketTimeframe,
  signal?: AbortSignal
): Promise<RawKline[]> {
  const cleanPair = pair.toUpperCase().trim();
  const plan = TIMEFRAME_PLANS[timeframe];

  const allPages: RawKline[][] = [];
  let endTime: number | undefined;

  for (let page = 0; page < plan.maxPages; page++) {
    const params = new URLSearchParams({
      symbol: cleanPair,
      interval: plan.interval,
      limit: String(plan.limitPerPage),
    });
    if (endTime !== undefined) {
      params.set('endTime', String(endTime));
    }

    const raw = await fetchJsonWithValidation(
      `${REST_BASE}/api/v3/klines?${params.toString()}`,
      signal
    );

    const parsed = parseRawKlines(raw);
    if (parsed.length === 0) break;

    allPages.unshift(parsed);

    if (parsed.length < plan.limitPerPage) {
      break;
    }
    endTime = parsed[0].openTime - 1;
  }

  const merged = allPages.flat();
  if (merged.length === 0) {
    throw new Error(`No historical candles returned for ${cleanPair}`);
  }

  // Deduplicate by openTime and sort ascending
  const seen = new Set<number>();
  const deduped: RawKline[] = [];
  for (const k of merged) {
    if (!seen.has(k.openTime)) {
      seen.add(k.openTime);
      deduped.push(k);
    }
  }
  deduped.sort((a, b) => a.openTime - b.openTime);
  return deduped;
}

export interface LiveKlineUpdate {
  pair: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  isClosed: boolean;
}

export interface StreamHandlers {
  onTicker: (ticker: Ticker24hData) => void;
  onKline: (kline: LiveKlineUpdate) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export class BinanceStreamManager {
  private ws: WebSocket | null = null;
  private currentPair: string | null = null;
  private activeStreams: Set<string> = new Set();
  private handlers: StreamHandlers;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private msgId = 1;

  constructor(handlers: StreamHandlers) {
    this.handlers = handlers;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    if (!this.destroyed && this.currentPair) {
      this.reconnectAttempts = 0;
      this.connect();
    }
  };

  private handleOffline = () => {
    this.handlers.onStatusChange('offline');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  };

  public subscribePair(pair: string): void {
    const upper = pair.toUpperCase().trim();
    if (this.currentPair === upper && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const previousPair = this.currentPair;
    this.currentPair = upper;

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.handlers.onStatusChange('offline');
      return;
    }

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.connect();
      return;
    }

    if (this.ws.readyState === WebSocket.OPEN) {
      if (previousPair && previousPair !== upper) {
        this.sendUnsubscribe(previousPair);
      }
      this.sendSubscribe(upper);
    }
  }

  private buildStreams(pair: string): string[] {
    const lower = pair.toLowerCase();
    return [`${lower}@ticker`, `${lower}@kline_1m`];
  }

  private sendSubscribe(pair: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const streams = this.buildStreams(pair).filter((s) => !this.activeStreams.has(s));
    if (streams.length === 0) return;

    this.ws.send(
      JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: this.msgId++,
      })
    );
    streams.forEach((s) => this.activeStreams.add(s));
  }

  private sendUnsubscribe(pair: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const streams = this.buildStreams(pair).filter((s) => this.activeStreams.has(s));
    if (streams.length === 0) return;

    this.ws.send(
      JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: streams,
        id: this.msgId++,
      })
    );
    streams.forEach((s) => this.activeStreams.delete(s));
  }

  private connect(): void {
    if (this.destroyed) return;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // ignore close error
      }
      this.ws = null;
    }

    this.activeStreams.clear();
    this.handlers.onStatusChange(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const socket = new WebSocket(WS_BASE);
      this.ws = socket;

      socket.onopen = () => {
        if (this.destroyed || this.ws !== socket) return;
        this.reconnectAttempts = 0;
        this.handlers.onStatusChange('connected');
        if (this.currentPair) {
          this.sendSubscribe(this.currentPair);
        }
      };

      socket.onmessage = (event) => {
        if (this.destroyed || this.ws !== socket) return;
        try {
          const msg = JSON.parse(String(event.data)) as Record<string, unknown>;
          if (!msg || typeof msg !== 'object') return;

          const eventType = msg.e;
          const eventSymbol = typeof msg.s === 'string' ? msg.s.toUpperCase() : '';
          if (!eventSymbol || eventSymbol !== this.currentPair) return;

          if (eventType === '24hrTicker') {
            const price = Number(msg.c);
            if (!Number.isFinite(price) || price <= 0) return;
            this.handlers.onTicker({
              pair: eventSymbol,
              baseAsset: extractBaseAsset(eventSymbol),
              quoteAsset: extractQuoteAsset(eventSymbol),
              price,
              priceChange: toPositiveNum(msg.p),
              priceChangePercent: toPositiveNum(msg.P),
              highPrice: toPositiveNum(msg.h, price),
              lowPrice: toPositiveNum(msg.l, price),
              volume: toPositiveNum(msg.v),
              quoteVolume: toPositiveNum(msg.q),
              tradeCount: Math.max(0, Math.round(toPositiveNum(msg.n))),
              updatedAt: Date.now(),
              source: 'live',
            });
          } else if (eventType === 'kline' && typeof msg.k === 'object' && msg.k !== null) {
            const k = msg.k as Record<string, unknown>;
            const open = Number(k.o);
            const high = Number(k.h);
            const low = Number(k.l);
            const close = Number(k.c);
            if (
              !Number.isFinite(open) ||
              !Number.isFinite(high) ||
              !Number.isFinite(low) ||
              !Number.isFinite(close)
            ) {
              return;
            }
            this.handlers.onKline({
              pair: eventSymbol,
              openTime: toPositiveNum(k.t),
              closeTime: toPositiveNum(k.T),
              open,
              high,
              low,
              close,
              volume: toPositiveNum(k.v),
              quoteVolume: toPositiveNum(k.q),
              isClosed: Boolean(k.x),
            });
          }
        } catch {
          // ignore malformed WS packet
        }
      };

      socket.onerror = () => {
        if (this.destroyed || this.ws !== socket) return;
        this.handlers.onStatusChange('error');
      };

      socket.onclose = () => {
        if (this.destroyed || this.ws !== socket) return;
        this.activeStreams.clear();
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          this.handlers.onStatusChange('offline');
          return;
        }
        this.scheduleReconnect();
      };
    } catch {
      this.handlers.onStatusChange('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    if (this.reconnectTimer !== null) return;
    const delay = Math.min(15000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    this.handlers.onStatusChange('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public forceReconnect(): void {
    if (this.destroyed) return;
    this.reconnectAttempts = 0;
    this.connect();
  }

  public destroy(): void {
    this.destroyed = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.activeStreams.clear();
  }
}

export function formatCompactUsd(val: number): string {
  if (!Number.isFinite(val)) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B$`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M$`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K$`;
  return `${sign}${abs.toFixed(0)}$`;
}

export function formatMarketPrice(val: number): string {
  if (!Number.isFinite(val)) return '—';
  if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 10) return val.toFixed(3);
  return val.toFixed(4);
}


export interface MarketScreenerRow {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChangePercent: number;
  quoteVolume: number;
  highPrice: number;
  lowPrice: number;
  tradeCount: number;
}

export async function fetchMarketScreener(
  signal?: AbortSignal
): Promise<MarketScreenerRow[]> {
  const raw = await fetchJsonWithValidation(`${REST_BASE}/api/v3/ticker/24hr`, signal);
  if (!Array.isArray(raw)) {
    throw new Error('Unexpected Binance 24h market ticker response');
  }

  return raw.flatMap((item): MarketScreenerRow[] => {
    if (typeof item !== 'object' || item === null) return [];
    const row = item as Record<string, unknown>;
    const pair = typeof row.symbol === 'string' ? row.symbol : '';
    if (!pair.endsWith('USDT')) return [];

    const price = Number(row.lastPrice);
    const change = Number(row.priceChangePercent);
    const quoteVolume = Number(row.quoteVolume);
    const highPrice = Number(row.highPrice);
    const lowPrice = Number(row.lowPrice);
    const tradeCount = Number(row.count);

    if (![price, change, quoteVolume, highPrice, lowPrice].every(Number.isFinite) || price <= 0) {
      return [];
    }

    return [{
      pair,
      baseAsset: extractBaseAsset(pair),
      quoteAsset: 'USDT',
      price,
      priceChangePercent: change,
      quoteVolume,
      highPrice,
      lowPrice,
      tradeCount: Number.isFinite(tradeCount) ? tradeCount : 0,
    }];
  }).sort((a, b) => b.quoteVolume - a.quoteVolume);
}
