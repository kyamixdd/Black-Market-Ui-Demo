import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CohortTab, getUnlocksData } from '../data/demoData';

interface UnlocksPanelProps {
  symbol: string;
}

const UNLOCK_TABS: CohortTab[] = ['Time Held', 'Holdings', 'Whale'];

export const UnlocksPanel: React.FC<UnlocksPanelProps> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<CohortTab>('Time Held');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const data = useMemo(() => getUnlocksData(symbol, activeTab), [symbol, activeTab]);
  const chartSegments = data.segments.filter((s) => s.value > 0);

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:p-3 flex flex-col justify-between"
      aria-label="Token Unlocks"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1]">Unlocks</h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
        </div>
        <div className="flex items-center text-[9.5px] whitespace-nowrap">
          {UNLOCK_TABS.map((tab, idx) => (
            <React.Fragment key={tab}>
              {idx > 0 && <span className="text-[#46464D] mx-1">/</span>}
              <button
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'text-[#F1F1F1] font-medium'
                    : 'text-[#74747A] hover:text-[#B8B8C0]'
                }`}
              >
                {tab}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Donut Chart + Legend */}
      <div className="flex items-center justify-between gap-3">
        {/* Circular Donut */}
        <div className="relative w-[116px] h-[116px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <pattern
                  id="unlockDiagonalHatch"
                  width="5"
                  height="5"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="5" height="5" fill="#1C1C20" />
                  <line x1="0" y1="0" x2="0" y2="5" stroke="#8C8C94" strokeWidth="1.6" />
                </pattern>
              </defs>
              <Pie
                data={chartSegments}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={51}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                stroke="#3A3A40"
                strokeWidth={0.8}
                isAnimationActive={false}
                onMouseEnter={(_, idx) => setHoveredKey(chartSegments[idx]?.key ?? null)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {chartSegments.map((seg) => {
                  const fill =
                    seg.pattern === 'solid-light'
                      ? '#EAEAEB'
                      : seg.pattern === 'striped'
                        ? 'url(#unlockDiagonalHatch)'
                        : '#2C2C31';
                  const dimmed = hoveredKey !== null && hoveredKey !== seg.key;
                  return (
                    <Cell
                      key={seg.key}
                      fill={fill}
                      fillOpacity={dimmed ? 0.35 : 1}
                      className="cursor-pointer outline-none"
                    />
                  );
                })}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as { label: string; display: string };
                  return (
                    <div className="bg-[#18181B] border border-[#323237] rounded-[4px] px-2 py-1 text-[10px] font-mono-num text-[#F1F1F1] shadow-lg">
                      {item.label}: {item.display}
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Subtle outer ring matching screenshot */}
          <div className="pointer-events-none absolute inset-[4px] rounded-full border border-[#34343A]" />

          {/* Center Readout */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[20px] font-mono-num font-medium text-[#F1F1F1]">
              {data.centerPct}%
            </span>
            <span className="text-[9.5px] text-[#7E7E85] mt-1">
              {data.centerLabel}
            </span>
          </div>
        </div>

        {/* Vertical Legend */}
        <div className="flex-1 min-w-0 space-y-2 pl-1">
          {data.segments.map((seg) => {
            const active = hoveredKey === seg.key;
            return (
              <div
                key={seg.key}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-between gap-2 text-[9.5px] cursor-pointer transition-opacity ${
                  hoveredKey && !active ? 'opacity-45' : 'opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {seg.pattern === 'striped' ? (
                    <span
                      className="w-2 h-2 rounded-[1px] shrink-0 border border-[#6E6E75]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #8C8C94 0px, #8C8C94 1.5px, #1C1C20 1.5px, #1C1C20 3px)',
                      }}
                    />
                  ) : (
                    <span
                      className="w-2 h-2 rounded-[1px] shrink-0"
                      style={{
                        backgroundColor:
                          seg.pattern === 'solid-light'
                            ? '#EAEAEB'
                            : seg.pattern === 'solid-dark'
                              ? '#323238'
                              : '#525258',
                      }}
                    />
                  )}
                  <span className="text-[#929298] truncate">{seg.label}</span>
                </div>
                <span className="font-mono-num text-[#E4E4E7] shrink-0">
                  {seg.display}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
