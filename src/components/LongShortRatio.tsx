import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { LongShortPoint, LongShortTimeframe, getLongShortData } from '../data/demoData';
import { TimeframeSelector } from './TimeframeSelector';

interface LongShortRatioProps {
  symbol: string;
}

const LS_TFS: readonly LongShortTimeframe[] = ['24H', '1D', '7D', 'All'];

export const LongShortRatio: React.FC<LongShortRatioProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState<LongShortTimeframe>('7D');

  const data = useMemo(() => getLongShortData(symbol, timeframe), [symbol, timeframe]);

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:p-3 flex flex-col justify-between"
      aria-label="Long Short Ratio"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1] truncate">
            Long/Short Ratio
          </h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
        </div>
        <TimeframeSelector
          options={LS_TFS}
          value={timeframe}
          onChange={setTimeframe}
        />
      </div>

      {/* Dual-Axis Area Chart */}
      <div className="h-[166px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="numoraLsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8E8E96" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#38383E" stopOpacity={0.14} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#1E1E22"
              vertical={true}
              horizontal={true}
            />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: '#252529' }}
              tickLine={false}
              interval={0}
              tick={{
                fill: '#7E7E85',
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              width={32}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              tick={{
                fill: '#7E7E85',
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={32}
              domain={[0.8, 1.2]}
              ticks={[0.8, 0.9, 1.0, 1.1, 1.2]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => Number(v).toFixed(2)}
              tick={{
                fill: '#7E7E85',
                fontSize: 9,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <ReferenceLine
              yAxisId="left"
              y={50}
              stroke="#3E3E44"
              strokeDasharray="3 3"
            />
            <Tooltip
              cursor={{ stroke: '#6E6E76', strokeDasharray: '3 3', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as LongShortPoint;
                return (
                  <div className="bg-[#1C1C20] border border-[#36363C] rounded-[5px] px-2.5 py-2 text-[10.5px] font-mono-num text-[#F1F1F1] shadow-xl">
                    <div className="text-[10px] text-[#C8C8CE] mb-1.5">
                      {d.fullTime}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-1.5 text-[#9A9AA2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EAEAEB]" />
                        Long
                      </span>
                      <span>{d.longPct.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-0.5">
                      <span className="inline-flex items-center gap-1.5 text-[#9A9AA2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#686870]" />
                        Short
                      </span>
                      <span>{d.shortPct.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 mt-0.5 pt-1 border-t border-[#2B2B30]">
                      <span className="text-[#9A9AA2]">Long/Short</span>
                      <span className="text-[#F1F1F1]">{d.ratio.toFixed(4)}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="longPct"
              stroke="#E5E5E7"
              strokeWidth={1.4}
              fill="url(#numoraLsFill)"
              activeDot={{ r: 3.5, fill: '#EAEAEB', stroke: '#151517', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ratio"
              stroke="transparent"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
