import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  CandlestickChart,
  TrendingUp,
  CheckSquare,
  Square,
  Undo2,
  Redo2,
  Calendar,
  SlidersHorizontal,
  Maximize2,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  ChartCandlePoint,
  ConnectionStatus,
  MarketTimeframe,
  Ticker24hData,
  extractBaseAsset,
  formatCompactUsd,
  formatMarketPrice,
} from '../services/binanceMarketService';
import { TimeframeSelector } from './TimeframeSelector';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';

interface MarketChartProps {
  pair: string;
  timeframe: MarketTimeframe;
  onTimeframeChange: (tf: MarketTimeframe) => void;
  ticker: Ticker24hData | null;
  candles: ChartCandlePoint[];
  loadingTicker: boolean;
  loadingKlines: boolean;
  tickerError: string | null;
  klinesError: string | null;
  connectionStatus: ConnectionStatus;
  lastUpdatedAt: number | null;
  onRetry: () => void;
  onReconnect: () => void;
}

interface ChartConfigState {
  timeframe: MarketTimeframe;
  chartType: 'candle' | 'line';
  showIndicators: boolean;
  metricMode: 'price' | 'mcap';
  scaleMode: 'log' | 'auto';
}

interface EnrichedCandle extends ChartCandlePoint {
  hlRange: [number, number];
}

const TIMEFRAMES: readonly MarketTimeframe[] = ['1D', '7D', '1M', '1Y', 'All'];

function formatAxisPrice(val: number): string {
  if (!Number.isFinite(val)) return '0';
  if (val >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (val >= 100) return val.toFixed(2);
  if (val >= 0.01) return val.toFixed(4);
  return val.toFixed(6);
}

function formatCompactBaseVol(val: number): string {
  if (!Number.isFinite(val)) return '—';
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toFixed(1);
}

interface CandleShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: EnrichedCandle;
  monochrome: boolean;
  peakValue: number;
  isPeakIndex: boolean;
}

const CandleShape: React.FC<CandleShapeProps> = ({
  x = 0,
  y = 0,
  width = 6,
  height = 0,
  payload,
  monochrome,
  peakValue,
  isPeakIndex,
}) => {
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isBull = close >= open;
  const span = Math.max(1e-12, high - low);

  const ratioToY = (val: number) => y + ((high - val) / span) * Math.max(1, height);

  const openY = ratioToY(open);
  const closeY = ratioToY(close);
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

  const candleW = Math.max(2, Math.min(5.5, width * 0.72));
  const centerX = x + width / 2;
  const bodyX = centerX - candleW / 2;

  const bullStroke = monochrome ? '#EAEAEB' : '#52A675';
  const bullFill = monochrome ? '#EAEAEB' : '#52A675';
  const bearStroke = monochrome ? '#8C8C92' : '#B95656';
  const bearFill = monochrome ? '#151517' : '#2A191B';

  const stroke = isBull ? bullStroke : bearStroke;
  const fill = isBull ? bullFill : bearFill;

  return (
    <g>
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={bodyTop}
        stroke={stroke}
        strokeWidth={1}
      />
      <line
        x1={centerX}
        y1={bodyTop + bodyHeight}
        x2={centerX}
        y2={y + Math.max(1, height)}
        stroke={stroke}
        strokeWidth={1}
      />
      <rect
        x={bodyX}
        y={bodyTop}
        width={candleW}
        height={bodyHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        rx={0.5}
      />
      {isPeakIndex &&
        (() => {
          const flipRight = centerX < 70;
          return (
            <g>
              <line
                x1={flipRight ? centerX + 3 : centerX - 24}
                y1={y}
                x2={flipRight ? centerX + 24 : centerX - 3}
                y2={y}
                stroke="#5A5A60"
                strokeWidth={0.8}
              />
              <text
                x={flipRight ? centerX + 28 : centerX - 28}
                y={y + 3}
                textAnchor={flipRight ? 'start' : 'end'}
                fill="#C2C2C8"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
              >
                {formatAxisPrice(peakValue)}
              </text>
            </g>
          );
        })()}
    </g>
  );
};

export const MarketChart: React.FC<MarketChartProps> = ({
  pair,
  timeframe,
  onTimeframeChange,
  ticker,
  candles,
  loadingTicker,
  loadingKlines,
  tickerError,
  klinesError,
  connectionStatus,
  lastUpdatedAt,
  onRetry,
  onReconnect,
}) => {
  const baseAsset = extractBaseAsset(pair);

  const [history, setHistory] = useState<Omit<ChartConfigState, 'timeframe'>[]>([
    {
      chartType: 'candle',
      showIndicators: false,
      metricMode: 'price',
      scaleMode: 'auto',
    },
  ]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [monochromeCandles, setMonochromeCandles] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [dateWindow, setDateWindow] = useState<'full' | 'recent' | 'early'>('full');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiedPair, setCopiedPair] = useState(false);

  const current = history[historyIdx];

  const updateConfig = (patch: Partial<Omit<ChartConfigState, 'timeframe'>>) => {
    const next = { ...current, ...patch };
    const sliced = history.slice(0, historyIdx + 1);
    setHistory([...sliced, next]);
    setHistoryIdx(sliced.length);
  };

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  const { enrichedCandles, yDomain, currentValue, peakValue, peakIndex } = useMemo(() => {
    const len = candles.length;
    const windowed =
      dateWindow === 'recent' && len > 32
        ? candles.slice(Math.floor(len * 0.35))
        : dateWindow === 'early' && len > 32
          ? candles.slice(0, Math.floor(len * 0.7))
          : candles;

    const enriched: EnrichedCandle[] = windowed.map((c) => ({
      ...c,
      hlRange: [c.low, c.high],
    }));

    let minVal = Infinity;
    let maxVal = -Infinity;
    let maxIdx = 0;
    enriched.forEach((c, idx) => {
      if (c.low < minVal) minVal = c.low;
      if (c.high > maxVal) {
        maxVal = c.high;
        maxIdx = idx;
      }
    });

    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      return {
        enrichedCandles: [],
        yDomain: [0, 1] as [number, number],
        currentValue: ticker?.price ?? 0,
        peakValue: 0,
        peakIndex: 0,
      };
    }

    const pad = (maxVal - minVal) * 0.14 || maxVal * 0.03;
    const domain: [number, number] = [Math.max(1e-8, minVal - pad), maxVal + pad];
    const lastVal =
      ticker?.price ?? enriched[enriched.length - 1]?.close ?? 0;

    return {
      enrichedCandles: enriched,
      yDomain: domain,
      currentValue: lastVal,
      peakValue: maxVal,
      peakIndex: maxIdx,
    };
  }, [candles, dateWindow, ticker?.price]);

  const handleCopyPair = () => {
    navigator.clipboard?.writeText(pair).catch(() => {});
    setCopiedPair(true);
    setTimeout(() => setCopiedPair(false), 1400);
  };

  const statusText =
    connectionStatus === 'connected'
      ? 'LIVE'
      : connectionStatus === 'reconnecting'
        ? 'RECONNECTING'
        : connectionStatus === 'connecting'
          ? 'CONNECTING'
          : connectionStatus === 'offline'
            ? 'OFFLINE'
            : 'WS ERROR';

  const statusColor =
    connectionStatus === 'connected'
      ? 'text-[#4D9E6E]'
      : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
        ? 'text-[#B8B8C0]'
        : 'text-[#C05656]';

  const updatedTimeStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

  const renderChartBody = (heightClass: string) => {
    if (current.metricMode === 'mcap') {
      return (
        <div className={`w-full ${heightClass} flex flex-col items-center justify-center text-center px-4 border border-[#222226] rounded-[4px] bg-[#131315]`}>
          <div className="text-[11.5px] font-medium text-[#E4E4E7]">
            Market Cap Unavailable
          </div>
          <p className="text-[10.5px] text-[#7E7E85] mt-1 max-w-sm">
            Binance public Spot API provides live price and trading volume for {pair}, without circulating supply data.
          </p>
          <button
            type="button"
            onClick={() => updateConfig({ metricMode: 'price' })}
            className="mt-2.5 px-2.5 py-1 text-[10.5px] bg-[#212126] border border-[#383840] text-[#F1F1F1] rounded-[3px] hover:bg-[#2A2A30] cursor-pointer"
          >
            Switch back to Price
          </button>
        </div>
      );
    }

    if (klinesError && enrichedCandles.length === 0) {
      return (
        <div className={`w-full ${heightClass} flex flex-col items-center justify-center text-center px-4 border border-[#2A2022] rounded-[4px] bg-[#141213]`}>
          <div className="text-[11.5px] font-medium text-[#C05656]">
            Failed to load {pair} historical candles
          </div>
          <p className="text-[10.5px] font-mono-num text-[#8E8E95] mt-1">
            {klinesError}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[10.5px] bg-[#212126] border border-[#383840] text-[#F1F1F1] rounded-[3px] hover:bg-[#2A2A30] cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    if (loadingKlines && enrichedCandles.length === 0) {
      return (
        <div className={`w-full ${heightClass} flex items-center justify-center text-[11px] font-mono-num text-[#7E7E85]`}>
          Loading {pair} {timeframe} historical candles from Binance...
        </div>
      );
    }

    return (
      <div className={`relative w-full ${heightClass} select-none`}>
        {loadingKlines && (
          <div className="absolute top-1.5 left-2 z-10 text-[9.5px] font-mono-num text-[#8E8E95] bg-[#151517]/90 px-1.5 py-0.5 rounded-[3px] border border-[#2A2A2E]">
            Updating {timeframe}...
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={enrichedCandles}
            margin={{ top: 10, right: 4, left: 4, bottom: 2 }}
          >
            {showGrid && (
              <CartesianGrid
                stroke="#1E1E22"
                strokeDasharray="0"
                vertical={false}
                horizontal={true}
              />
            )}
            {showGrid &&
              enrichedCandles
                .filter((c) => Boolean(c.axisLabel))
                .map((c) => (
                  <ReferenceLine
                    key={`vgrid-${c.index}`}
                    x={c.index}
                    stroke="#1E1E22"
                    strokeWidth={1}
                  />
                ))}
            <XAxis
              dataKey="index"
              tickLine={false}
              axisLine={{ stroke: '#232327' }}
              interval={0}
              tick={({ x, y, payload }) => {
                const point = enrichedCandles.find((c) => c.index === payload.value);
                if (!point?.axisLabel) return <g />;
                return (
                  <text
                    x={x}
                    y={Number(y) + 11}
                    textAnchor="middle"
                    fill="#78787E"
                    fontSize={9.5}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {point.axisLabel}
                  </text>
                );
              }}
            />
            <YAxis
              orientation="right"
              domain={yDomain}
              allowDataOverflow={true}
              scale={current.scaleMode === 'log' ? 'log' : 'linear'}
              tickLine={false}
              axisLine={false}
              width={54}
              tickCount={5}
              tickFormatter={(v) => formatAxisPrice(Number(v))}
              tick={{
                fill: '#7E7E85',
                fontSize: 9.5,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <Tooltip
              cursor={{ stroke: '#4A4A50', strokeDasharray: '3 3', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as EnrichedCandle;
                const bull = d.close >= d.open;
                return (
                  <div className="bg-[#18181B] border border-[#323237] rounded-[5px] px-2.5 py-2 text-[10.5px] font-mono-num text-[#E4E4E7] shadow-xl">
                    <div className="flex items-center justify-between gap-4 border-b border-[#27272B] pb-1 mb-1">
                      <span className="text-[#F1F1F1] font-medium">{pair}</span>
                      <span className="text-[#8A8A90]">{d.time}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span className="text-[#8A8A90]">Open</span>
                      <span className="text-right">{formatAxisPrice(d.open)}</span>
                      <span className="text-[#8A8A90]">High</span>
                      <span className="text-right">{formatAxisPrice(d.high)}</span>
                      <span className="text-[#8A8A90]">Low</span>
                      <span className="text-right">{formatAxisPrice(d.low)}</span>
                      <span className="text-[#8A8A90]">Close</span>
                      <span className={`text-right ${bull ? 'text-[#4D9E6E]' : 'text-[#C05656]'}`}>
                        {formatAxisPrice(d.close)}
                      </span>
                      <span className="text-[#8A8A90]">Vol</span>
                      <span className="text-right text-[#D4D4D8]">
                        {formatCompactBaseVol(d.volume)} {baseAsset}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            {currentValue > 0 && (
              <ReferenceLine
                y={currentValue}
                stroke="#7C7C84"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={({ viewBox }) => {
                  if (!viewBox) return <g />;
                  const { x = 0, y = 0, width = 0 } = viewBox as {
                    x?: number;
                    y?: number;
                    width?: number;
                  };
                  const labelText = formatAxisPrice(currentValue);
                  return (
                    <g transform={`translate(${x + width + 4}, ${y - 8})`}>
                      <rect x={0} y={0} width={48} height={16} rx={2} fill="#E6E6E8" />
                      <text
                        x={24}
                        y={11}
                        textAnchor="middle"
                        fill="#111113"
                        fontSize={9}
                        fontWeight={600}
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                }}
              />
            )}

            {current.chartType === 'candle' ? (
              <Bar
                dataKey="hlRange"
                isAnimationActive={false}
                shape={(props: unknown) => {
                  const p = props as CandleShapeProps;
                  return (
                    <CandleShape
                      {...p}
                      monochrome={monochromeCandles}
                      peakValue={peakValue}
                      isPeakIndex={p.payload?.index === enrichedCandles[peakIndex]?.index}
                    />
                  );
                }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="close"
                stroke="#EAEAEB"
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {current.showIndicators && (
              <>
                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#6C6C74"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema20"
                  stroke="#4A4A50"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Bottom-right log / auto toggle */}
        <div className="absolute right-1.5 bottom-[2px] flex items-center gap-1 text-[9.5px] font-mono-num">
          <button
            type="button"
            onClick={() =>
              updateConfig({ scaleMode: current.scaleMode === 'log' ? 'auto' : 'log' })
            }
            className="cursor-pointer transition-colors"
            title="Toggle logarithmic or linear auto scale"
          >
            <span className={current.scaleMode === 'log' ? 'text-[#F1F1F1]' : 'text-[#6F6F76]'}>
              log
            </span>
            <span className="text-[#4F4F55] mx-0.5">/</span>
            <span className={current.scaleMode === 'auto' ? 'text-[#F1F1F1]' : 'text-[#6F6F76]'}>
              auto
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:px-3 sm:pt-2.5 sm:pb-2 flex flex-col"
      aria-label="Market Price Chart"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        {/* Left Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Token Identity */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-[24px] h-[24px] rounded-full bg-[#222226] border border-[#343439] flex items-center justify-center shrink-0">
              {baseAsset === 'SUI' ? (
                <svg width="11" height="14" viewBox="0 0 14 18" fill="none" aria-hidden="true">
                  <path
                    d="M7 1.5C7 1.5 2 7.2 2 11.2C2 14.0 4.24 16.25 7 16.25C9.76 16.25 12 14.0 12 11.2C12 7.2 7 1.5 7 1.5Z"
                    stroke="#E5E5E7"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M4.8 11.6C5.1 12.8 6.0 13.5 7.2 13.5"
                    stroke="#E5E5E7"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <span className="text-[10px] font-mono-num font-semibold text-[#EAEAEB]">
                  {baseAsset.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-[#F1F1F1]">
                  {baseAsset}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPair}
                title="Copy Binance trading pair"
                className="flex items-center gap-1 text-[9.5px] font-mono-num text-[#74747A] hover:text-[#B4B4BC] cursor-pointer"
              >
                <span>{copiedPair ? 'Copied' : pair}</span>
                {copiedPair && <Check className="w-2.5 h-2.5 text-[#4D9E6E]" />}
              </button>
            </div>
          </div>

          <span className="h-4 w-[1px] bg-[#29292D] hidden sm:inline-block" />

          {/* Candlestick / Line toggle */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => updateConfig({ chartType: 'candle' })}
              className={`p-1 rounded-[3px] cursor-pointer transition-colors ${
                current.chartType === 'candle'
                  ? 'bg-[#232328] text-[#F1F1F1]'
                  : 'text-[#76767D] hover:text-[#D4D4D8]'
              }`}
              title="Candlestick view"
              aria-label="Candlestick chart"
            >
              <CandlestickChart className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateConfig({ chartType: 'line' })}
              className={`p-1 rounded-[3px] cursor-pointer transition-colors ${
                current.chartType === 'line'
                  ? 'bg-[#232328] text-[#F1F1F1]'
                  : 'text-[#76767D] hover:text-[#D4D4D8]'
              }`}
              title="Line view"
              aria-label="Line chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="h-4 w-[1px] bg-[#29292D] hidden sm:inline-block" />

          {/* Indicators toggle */}
          <button
            type="button"
            onClick={() => updateConfig({ showIndicators: !current.showIndicators })}
            className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-[3px] cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              current.showIndicators
                ? 'text-[#E4E4E7]'
                : 'text-[#76767D] hover:text-[#C8C8CE]'
            }`}
            title="Toggle MA(7) & EMA(20) calculated from live candles"
          >
            {current.showIndicators ? (
              <CheckSquare className="w-3 h-3 text-[#C4C4CA]" />
            ) : (
              <Square className="w-3 h-3 text-[#6E6E75]" />
            )}
            <span>Indicators</span>
          </button>

          <span className="h-4 w-[1px] bg-[#29292D] hidden sm:inline-block" />

          {/* Price / Market Cap selector */}
          <div className="inline-flex items-center text-[10.5px] whitespace-nowrap shrink-0">
            <button
              type="button"
              onClick={() => updateConfig({ metricMode: 'price' })}
              className={`cursor-pointer transition-colors ${
                current.metricMode === 'price'
                  ? 'text-[#F1F1F1] font-medium'
                  : 'text-[#76767D] hover:text-[#C8C8CE]'
              }`}
            >
              Price
            </button>
            <span className="text-[#4F4F56] mx-1">/</span>
            <button
              type="button"
              onClick={() => updateConfig({ metricMode: 'mcap' })}
              className={`cursor-pointer transition-colors ${
                current.metricMode === 'mcap'
                  ? 'text-[#F1F1F1] font-medium'
                  : 'text-[#76767D] hover:text-[#C8C8CE]'
              }`}
            >
              Market cap
            </button>
          </div>

          <span className="h-4 w-[1px] bg-[#29292D] hidden md:inline-block" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={!canUndo}
              onClick={() => canUndo && setHistoryIdx((i) => i - 1)}
              className={`p-1 rounded-[3px] transition-colors ${
                canUndo
                  ? 'text-[#A1A1A8] hover:text-[#F1F1F1] cursor-pointer'
                  : 'text-[#44444A] cursor-not-allowed'
              }`}
              title="Undo chart action"
              aria-label="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={() => canRedo && setHistoryIdx((i) => i + 1)}
              className={`p-1 rounded-[3px] transition-colors ${
                canRedo
                  ? 'text-[#A1A1A8] hover:text-[#F1F1F1] cursor-pointer'
                  : 'text-[#44444A] cursor-not-allowed'
              }`}
              title="Redo chart action"
              aria-label="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <TimeframeSelector
            options={TIMEFRAMES}
            value={timeframe}
            onChange={onTimeframeChange}
          />

          <div className="flex items-center gap-0.5 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCalendarOpen((o) => !o);
                  setSettingsOpen(false);
                }}
                className={`p-1 rounded-[3px] cursor-pointer transition-colors ${
                  dateWindow !== 'full'
                    ? 'text-[#F1F1F1] bg-[#232328]'
                    : 'text-[#84848B] hover:text-[#F1F1F1]'
                }`}
                title="Select candle window"
                aria-label="Date window"
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
              <Dropdown isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} widthClass="w-44">
                <div className="px-2.5 py-1 text-[10px] text-[#7A7A80] border-b border-[#26262A]">
                  Visible Window
                </div>
                {(
                  [
                    ['full', 'Full Loaded Range'],
                    ['recent', 'Recent 65% Window'],
                    ['early', 'Earlier 70% Window'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDateWindow(key);
                      setCalendarOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-[11px] cursor-pointer ${
                      dateWindow === key
                        ? 'bg-[#242429] text-[#F1F1F1]'
                        : 'text-[#A8A8AE] hover:bg-[#202024]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </Dropdown>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen((o) => !o);
                  setCalendarOpen(false);
                }}
                className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
                title="Chart settings"
                aria-label="Chart settings"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <Dropdown isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} widthClass="w-48">
                <div className="px-2.5 py-1 text-[10px] text-[#7A7A80] border-b border-[#26262A]">
                  Terminal Chart Settings
                </div>
                <button
                  type="button"
                  onClick={() => setMonochromeCandles((m) => !m)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-[#C8C8CE] hover:bg-[#202024] cursor-pointer"
                >
                  <span>Monochrome Candles</span>
                  <span className="font-mono-num text-[10px] text-[#8E8E93]">
                    {monochromeCandles ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrid((g) => !g)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-[#C8C8CE] hover:bg-[#202024] cursor-pointer"
                >
                  <span>Gridlines</span>
                  <span className="font-mono-num text-[10px] text-[#8E8E93]">
                    {showGrid ? 'ON' : 'OFF'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig({
                      scaleMode: current.scaleMode === 'log' ? 'auto' : 'log',
                    })
                  }
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] text-[#C8C8CE] hover:bg-[#202024] cursor-pointer"
                >
                  <span>Scale Mode</span>
                  <span className="font-mono-num text-[10px] text-[#8E8E93] uppercase">
                    {current.scaleMode}
                  </span>
                </button>
              </Dropdown>
            </div>

            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
              title="Fullscreen chart"
              aria-label="Fullscreen market chart"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Slim Inline Live Market Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-1 text-[9.5px] font-mono-num text-[#7E7E85]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 min-w-0">
          {tickerError && !ticker ? (
            <span className="text-[#C05656] truncate">Ticker error: {tickerError}</span>
          ) : loadingTicker && !ticker ? (
            <span>Loading {pair} ticker...</span>
          ) : ticker ? (
            <>
              <span className="text-[#F1F1F1] font-medium">
                ${formatMarketPrice(ticker.price)}
              </span>
              <span
                className={
                  ticker.priceChangePercent >= 0 ? 'text-[#4D9E6E]' : 'text-[#C05656]'
                }
              >
                {ticker.priceChange >= 0 ? '+' : ''}
                {formatMarketPrice(ticker.priceChange)} (
                {ticker.priceChangePercent >= 0 ? '+' : ''}
                {ticker.priceChangePercent.toFixed(2)}%)
              </span>
              <span className="hidden sm:inline">
                H {formatMarketPrice(ticker.highPrice)} · L {formatMarketPrice(ticker.lowPrice)}
              </span>
              <span className="hidden md:inline">
                Vol {formatCompactUsd(ticker.quoteVolume)}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={connectionStatus !== 'connected' ? onReconnect : undefined}
            className={`${statusColor} ${
              connectionStatus !== 'connected' ? 'hover:underline cursor-pointer' : 'cursor-default'
            }`}
            title={
              connectionStatus === 'connected'
                ? 'Binance WebSocket live stream active'
                : 'Click to reconnect Binance WebSocket'
            }
          >
            {statusText}
          </button>
          <span aria-hidden="true">·</span>
          <span>HIST</span>
          <span aria-hidden="true">·</span>
          <span>{updatedTimeStr}</span>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="pt-0.5">{renderChartBody('h-[204px] sm:h-[214px]')}</div>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        title={`${pair} — Live & Historical Market Chart (${timeframe})`}
        subtitle={`Binance Spot (${statusText}) · Updated ${updatedTimeStr}`}
        maxWidthClass="max-w-4xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-[#252528]">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono-num">
            <span className="text-[#F1F1F1]">
              Last: ${formatMarketPrice(currentValue)}
            </span>
            {ticker && (
              <>
                <span
                  className={
                    ticker.priceChangePercent >= 0 ? 'text-[#4D9E6E]' : 'text-[#C05656]'
                  }
                >
                  24h: {ticker.priceChangePercent >= 0 ? '+' : ''}
                  {ticker.priceChangePercent.toFixed(2)}%
                </span>
                <span className="text-[#8E8E93]">
                  24h H/L: {formatMarketPrice(ticker.highPrice)} / {formatMarketPrice(ticker.lowPrice)}
                </span>
              </>
            )}
          </div>
          <TimeframeSelector
            options={TIMEFRAMES}
            value={timeframe}
            onChange={onTimeframeChange}
            size="sm"
          />
        </div>
        {renderChartBody('h-[380px]')}
      </Modal>
    </section>
  );
};
