import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  LiveVolumeSummary,
  MarketTimeframe,
  buildVolumeSummary,
  fetchHistoricalKlines,
  formatCompactUsd,
} from '../services/binanceMarketService';
import { TimeframeSelector } from './TimeframeSelector';

interface BuySellVolumeProps {
  pair: string;
  marketTimeframe: MarketTimeframe;
  marketVolumeSummary: LiveVolumeSummary | null;
  marketLoading: boolean;
  marketError: string | null;
}

const VOLUME_TFS: readonly MarketTimeframe[] = ['1D', '7D', '1M', '1Y', 'All'];

function formatVolumeAxisTick(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${Math.round(v / 1e6)}M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v));
}

export const BuySellVolume: React.FC<BuySellVolumeProps> = ({
  pair,
  marketTimeframe,
  marketVolumeSummary,
  marketLoading,
  marketError,
}) => {
  const [timeframe, setTimeframe] = useState<MarketTimeframe>('1M');
  const [customSummary, setCustomSummary] = useState<LiveVolumeSummary | null>(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Avoid duplicate REST requests when local timeframe matches the main chart timeframe
  const useShared = timeframe === marketTimeframe;

  useEffect(() => {
    if (useShared) {
      setCustomSummary(null);
      setCustomError(null);
      setCustomLoading(false);
      return;
    }

    const controller = new AbortController();
    setCustomLoading(true);
    setCustomError(null);

    fetchHistoricalKlines(pair, timeframe, controller.signal)
      .then((klines) => {
        if (controller.signal.aborted) return;
        setCustomSummary(buildVolumeSummary(klines, timeframe));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setCustomError(err instanceof Error ? err.message : 'Failed to load volume');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCustomLoading(false);
      });

    return () => controller.abort();
  }, [pair, timeframe, useShared]);

  const activeSummary = useShared ? marketVolumeSummary : customSummary;
  const isLoading = useShared ? marketLoading : customLoading;
  const error = useShared ? marketError : customError;

  const updatedStr = activeSummary
    ? new Date(activeSummary.updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const netBuyPositive = (activeSummary?.netBuyQuote ?? 0) >= 0;

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:p-3 flex flex-col justify-between"
      aria-label="Buys and Sells Volume"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1] truncate">
            Buys/Sells Volume
          </h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            HIST · {updatedStr}
          </span>
        </div>
        <TimeframeSelector
          options={VOLUME_TFS}
          value={timeframe}
          onChange={setTimeframe}
        />
      </div>

      {/* 4-Column Top Statistics */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2.5">
        <div className="min-w-0">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Txns</div>
          <div className="text-[12px] sm:text-[13.5px] font-mono-num font-medium text-[#F1F1F1] truncate mt-0.5 leading-tight">
            {activeSummary ? activeSummary.txns.toLocaleString() : isLoading ? '...' : '—'}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Vol</div>
          <div className="text-[12px] sm:text-[13.5px] font-mono-num font-medium text-[#F1F1F1] truncate mt-0.5 leading-tight">
            {activeSummary ? formatCompactUsd(activeSummary.quoteVolume) : isLoading ? '...' : '—'}
          </div>
        </div>
        <div className="min-w-0" title="On-chain fees unavailable from Binance Spot API">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Chain Fees</div>
          <div className="text-[12px] sm:text-[13.5px] font-mono-num font-medium text-[#7A7A82] truncate mt-0.5 leading-tight">
            N/A
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Net Buy</div>
          <div
            className={`text-[12px] sm:text-[13.5px] font-mono-num font-medium truncate mt-0.5 leading-tight ${
              !activeSummary
                ? 'text-[#7A7A82]'
                : netBuyPositive
                  ? 'text-[#4D9E6E]'
                  : 'text-[#C05656]'
            }`}
          >
            {activeSummary
              ? `${netBuyPositive ? '+' : ''}${formatCompactUsd(activeSummary.netBuyQuote)}`
              : isLoading
                ? '...'
                : '—'}
          </div>
        </div>
      </div>

      {/* Grouped Vertical Bar Chart */}
      <div className="h-[124px] w-full">
        {error && !activeSummary ? (
          <div className="h-full flex items-center justify-center text-center text-[10px] font-mono-num text-[#C05656] px-2">
            {error}
          </div>
        ) : !activeSummary || activeSummary.bars.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] font-mono-num text-[#7E7E85]">
            {isLoading ? `Loading ${pair} taker volume...` : 'No volume data'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeSummary.bars}
              margin={{ top: 6, right: 2, left: 0, bottom: 0 }}
              barGap={4}
              barCategoryGap="22%"
            >
              <defs>
                <pattern
                  id="numoraBuyHatch"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="4" height="4" fill="#1D1D20" />
                  <line x1="0" y1="0" x2="0" y2="4" stroke="#E0E0E4" strokeWidth="1.6" />
                </pattern>
              </defs>
              <CartesianGrid stroke="#1E1E22" vertical={false} horizontal={true} />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: '#252529' }}
                tickLine={false}
                tick={{
                  fill: '#7E7E85',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <YAxis
                width={32}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatVolumeAxisTick}
                tick={{
                  fill: '#7E7E85',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const buyVal = Number(payload.find((p) => p.dataKey === 'buy')?.value ?? 0);
                  const sellVal = Number(payload.find((p) => p.dataKey === 'sell')?.value ?? 0);
                  return (
                    <div className="bg-[#18181B] border border-[#323237] rounded-[5px] px-2.5 py-1.5 text-[10.5px] font-mono-num text-[#F1F1F1] shadow-xl">
                      <div className="text-[#8E8E93] mb-1">
                        {label} · {timeframe}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#B4B4BC]">Taker Buy</span>
                        <span>{formatCompactUsd(buyVal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[#B4B4BC]">Taker Sell</span>
                        <span>{formatCompactUsd(sellVal)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="buy"
                fill="url(#numoraBuyHatch)"
                radius={[1.5, 1.5, 0, 0]}
                maxBarSize={13}
                isAnimationActive={false}
              />
              <Bar
                dataKey="sell"
                fill="#DCDCE0"
                radius={[1.5, 1.5, 0, 0]}
                maxBarSize={13}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
