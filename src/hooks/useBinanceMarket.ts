import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BinanceStreamManager,
  ChartCandlePoint,
  ConnectionStatus,
  LiveKlineUpdate,
  LiveVolumeSummary,
  MarketTimeframe,
  RawKline,
  Ticker24hData,
  buildChartCandles,
  buildVolumeSummary,
  fetchHistoricalKlines,
  fetchLatestPrice,
  fetchTicker24hr,
} from '../services/binanceMarketService';

export interface UseBinanceMarketResult {
  pair: string;
  timeframe: MarketTimeframe;
  setTimeframe: (tf: MarketTimeframe) => void;
  ticker: Ticker24hData | null;
  candles: ChartCandlePoint[];
  volumeSummary: LiveVolumeSummary | null;
  loadingTicker: boolean;
  loadingKlines: boolean;
  tickerError: string | null;
  klinesError: string | null;
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: number | null;
  retryLoad: () => void;
  reconnectStream: () => void;
}

export function useBinanceMarket(
  pair: string,
  initialTimeframe: MarketTimeframe = '1M'
): UseBinanceMarketResult {
  const [timeframe, setTimeframe] = useState<MarketTimeframe>(initialTimeframe);
  const [ticker, setTicker] = useState<Ticker24hData | null>(null);
  const [rawKlines, setRawKlines] = useState<RawKline[]>([]);
  const [liveKline, setLiveKline] = useState<LiveKlineUpdate | null>(null);
  const [loadingTicker, setLoadingTicker] = useState<boolean>(true);
  const [loadingKlines, setLoadingKlines] = useState<boolean>(true);
  const [tickerError, setTickerError] = useState<string | null>(null);
  const [klinesError, setKlinesError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const streamRef = useRef<BinanceStreamManager | null>(null);
  const cleanPair = pair.toUpperCase().trim();

  // Initialize single WebSocket manager and clean up on unmount
  useEffect(() => {
    const manager = new BinanceStreamManager({
      onTicker: (nextTicker) => {
        setTicker(nextTicker);
        setTickerError(null);
        setLastUpdatedAt(nextTicker.updatedAt);
      },
      onKline: (klineUpdate) => {
        setLiveKline(klineUpdate);
        setLastUpdatedAt(Date.now());
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });
    streamRef.current = manager;
    return () => {
      manager.destroy();
      streamRef.current = null;
    };
  }, []);

  // Subscribe to selected pair stream & fetch 24hr ticker via REST (with AbortController)
  useEffect(() => {
    const controller = new AbortController();
    setLoadingTicker(true);
    setTickerError(null);
    setTicker(null);
    setLiveKline(null);

    streamRef.current?.subscribePair(cleanPair);

    (async () => {
      try {
        const data = await fetchTicker24hr(cleanPair, controller.signal);
        if (controller.signal.aborted) return;
        setTicker((prev) => {
          // Keep live WS update if it arrived slightly before REST finished
          if (prev && prev.pair === cleanPair && prev.source === 'live') {
            return prev;
          }
          return data;
        });
        setLastUpdatedAt(data.updatedAt);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Fallback attempt to /ticker/price in case 24hr failed transiently
        try {
          const fallbackPrice = await fetchLatestPrice(cleanPair, controller.signal);
          if (controller.signal.aborted) return;
          setTicker({
            pair: cleanPair,
            baseAsset: cleanPair.replace(/(USDT|USDC|FDUSD|BTC|ETH|BNB)$/, ''),
            quoteAsset: cleanPair.endsWith('USDC') ? 'USDC' : cleanPair.endsWith('FDUSD') ? 'FDUSD' : 'USDT',
            price: fallbackPrice,
            priceChange: 0,
            priceChangePercent: 0,
            highPrice: fallbackPrice,
            lowPrice: fallbackPrice,
            volume: 0,
            quoteVolume: 0,
            tradeCount: 0,
            updatedAt: Date.now(),
            source: 'rest',
          });
          setLastUpdatedAt(Date.now());
        } catch (fallbackErr) {
          if (controller.signal.aborted) return;
          const message =
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : `Failed to fetch ${cleanPair} ticker`;
          setTickerError(message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTicker(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [cleanPair, reloadNonce]);

  // Fetch historical klines on pair or timeframe change (with AbortController)
  useEffect(() => {
    const controller = new AbortController();
    setLoadingKlines(true);
    setKlinesError(null);

    (async () => {
      try {
        const klines = await fetchHistoricalKlines(cleanPair, timeframe, controller.signal);
        if (controller.signal.aborted) return;
        setRawKlines(klines);
        setLastUpdatedAt(Date.now());
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : `Failed to load ${cleanPair} candles`;
        setKlinesError(message);
        setRawKlines([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingKlines(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [cleanPair, timeframe, reloadNonce]);

  // Merge live 1m kline + ticker price into the latest candle without fabricating historical candles
  const candles = useMemo(() => {
    const built = buildChartCandles(rawKlines, timeframe);
    if (built.length === 0) return built;

    const latestPrice =
      liveKline && liveKline.pair === cleanPair
        ? liveKline.close
        : ticker && ticker.pair === cleanPair
          ? ticker.price
          : null;

    if (latestPrice === null) return built;

    const updated = [...built];
    const last = { ...updated[updated.length - 1] };
    last.close = latestPrice;
    last.high = Math.max(last.high, latestPrice, liveKline?.high ?? latestPrice);
    last.low = Math.min(last.low, latestPrice, liveKline?.low ?? latestPrice);
    updated[updated.length - 1] = last;
    return updated;
  }, [rawKlines, timeframe, liveKline, ticker, cleanPair]);

  const volumeSummary = useMemo(() => {
    if (rawKlines.length === 0) return null;
    return buildVolumeSummary(rawKlines, timeframe);
  }, [rawKlines, timeframe]);

  const retryLoad = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

  const reconnectStream = useCallback(() => {
    streamRef.current?.forceReconnect();
  }, []);

  return {
    pair: cleanPair,
    timeframe,
    setTimeframe,
    ticker,
    candles,
    volumeSummary,
    loadingTicker,
    loadingKlines,
    tickerError,
    klinesError,
    connectionStatus,
    lastUpdatedAt,
    retryLoad,
    reconnectStream,
  };
}
