import React, { useMemo, useState } from 'react';
import { CohortTab, getHoldersData } from '../data/demoData';
import { Modal } from './Modal';

interface HoldersPanelProps {
  symbol: string;
}

const TABS: CohortTab[] = ['Time Held', 'Holdings', 'Whale'];

export const HoldersPanel: React.FC<HoldersPanelProps> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<CohortTab>('Time Held');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [seeAllOpen, setSeeAllOpen] = useState(false);

  const data = useMemo(() => getHoldersData(symbol, activeTab), [symbol, activeTab]);
  const hoveredBar = hoveredIdx !== null ? data.bars[hoveredIdx] : null;

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:p-3 flex flex-col justify-between"
      aria-label="Holders Analytics"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1]">Holders</h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
        </div>
        <div className="flex items-center text-[9.5px] whitespace-nowrap">
          {TABS.map((tab, idx) => (
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

      {/* 3-Column Cohort Metrics with Proportional Dividers */}
      <div className="grid grid-cols-[1.05fr_2.25fr_0.85fr] mb-2">
        <div className="pr-2 border-r border-[#2C2C31] min-w-0">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Cruisers</div>
          <div className="text-[15px] sm:text-[17px] font-mono-num font-medium text-[#A1A1A8] mt-1 leading-none">
            {data.cruisers}
            <span className="text-[10.5px] ml-0.5 text-[#7E7E85]">%</span>
          </div>
        </div>
        <div className="px-2.5 border-r border-[#2C2C31] min-w-0">
          <div className="text-[9.5px] text-[#B8B8C0] truncate">Holders</div>
          <div className="text-[15px] sm:text-[17px] font-mono-num font-medium text-[#F1F1F1] mt-1 leading-none">
            {data.holders}
            <span className="text-[10.5px] ml-0.5 text-[#A1A1A8]">%</span>
          </div>
        </div>
        <div className="pl-2 text-right min-w-0">
          <div className="text-[9.5px] text-[#7E7E85] truncate">Traders</div>
          <div className="text-[15px] sm:text-[17px] font-mono-num font-medium text-[#7A7A82] mt-1 leading-none">
            {data.traders}
            <span className="text-[10.5px] ml-0.5 text-[#626269]">%</span>
          </div>
        </div>
      </div>

      {/* Dense Vertical Distribution Bars */}
      <div className="relative py-1">
        <div className="flex items-end gap-[2.5px] h-[56px] w-full">
          {data.bars.map((bar) => {
            const bgColor =
              bar.tier === 'holder'
                ? '#EAEAEB'
                : bar.tier === 'cruiser'
                  ? '#5C5C63'
                  : '#3E3E44';
            const isHovered = hoveredIdx === bar.idx;
            return (
              <div
                key={bar.idx}
                onMouseEnter={() => setHoveredIdx(bar.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ backgroundColor: isHovered ? '#FFFFFF' : bgColor }}
                className="flex-1 h-full rounded-[0.5px] transition-opacity cursor-crosshair opacity-95 hover:opacity-100"
                title={`${bar.tier.toUpperCase()} cohort · ${bar.addresses.toLocaleString()} addresses (${bar.share})`}
              />
            );
          })}
        </div>
        {hoveredBar && (
          <div className="mt-1 text-[9.5px] font-mono-num text-[#B0B0B8] flex items-center justify-between">
            <span className="capitalize">{hoveredBar.tier}</span>
            <span>{hoveredBar.addresses.toLocaleString()} wallets ({hoveredBar.share})</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 text-[9.5px] font-mono-num">
        <div className="flex items-center gap-2.5 truncate">
          <span>
            <span className="text-[#78787F]">Whales </span>
            <span className="text-[#D8D8DE]">{data.whales}</span>
          </span>
          <span>
            <span className="text-[#78787F]">Others </span>
            <span className="text-[#D8D8DE]">{data.others}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSeeAllOpen(true)}
          className="text-[10px] font-sans text-[#8E8E95] hover:text-[#F1F1F1] transition-colors cursor-pointer shrink-0"
        >
          See all
        </button>
      </div>

      {/* Holders Breakdown Modal */}
      <Modal
        isOpen={seeAllOpen}
        onClose={() => setSeeAllOpen(false)}
        title={`${symbol} — Holder Distribution (${activeTab})`}
        subtitle="Demo cohort distribution and top wallet breakdown"
        maxWidthClass="max-w-lg"
      >
        <div className="grid grid-cols-3 gap-2 mb-4 pb-3 border-b border-[#27272B]">
          <div className="bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] p-2.5">
            <div className="text-[10px] text-[#8E8E93]">Cruisers</div>
            <div className="text-[15px] font-mono-num text-[#F1F1F1] mt-0.5">{data.cruisers}%</div>
          </div>
          <div className="bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] p-2.5">
            <div className="text-[10px] text-[#8E8E93]">Holders</div>
            <div className="text-[15px] font-mono-num text-[#F1F1F1] mt-0.5">{data.holders}%</div>
          </div>
          <div className="bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px] p-2.5">
            <div className="text-[10px] text-[#8E8E93]">Traders</div>
            <div className="text-[15px] font-mono-num text-[#F1F1F1] mt-0.5">{data.traders}%</div>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#27272B] text-[10px] text-[#7E7E85]">
              <th className="py-1.5 font-medium">Address</th>
              <th className="py-1.5 font-medium">Cohort Tag</th>
              <th className="py-1.5 font-medium text-right">Balance</th>
              <th className="py-1.5 font-medium text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222226] text-[11px] font-mono-num">
            {data.topAddresses.map((row) => (
              <tr key={row.address} className="hover:bg-[#1C1C20]">
                <td className="py-2 text-[#D4D4D8]">{row.address}</td>
                <td className="py-2 font-sans text-[#929292]">{row.tag}</td>
                <td className="py-2 text-right text-[#F1F1F1]">{row.balance}</td>
                <td className="py-2 text-right text-[#A1A1AA]">{row.pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </section>
  );
};
