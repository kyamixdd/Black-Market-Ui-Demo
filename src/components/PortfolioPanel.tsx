import React, { useMemo, useState } from 'react';
import {
  Download,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  CircleDollarSign,
} from 'lucide-react';
import {
  PORTFOLIO_ALLOCATIONS,
  PORTFOLIO_METRICS,
  getPortfolioGridCells,
} from '../data/demoData';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';

interface PortfolioPanelProps {
  symbol: string;
  onOpenBuyModal: () => void;
  highlighted?: boolean;
}

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  symbol,
  onOpenBuyModal,
  highlighted = false,
}) => {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const cells = useMemo(() => getPortfolioGridCells(PORTFOLIO_ALLOCATIONS), []);

  const handleDownloadCsv = () => {
    const header = 'asset,allocation_pct,demo_value_usd\n';
    const rows = PORTFOLIO_ALLOCATIONS.map(
      (a) => `${a.symbol},${a.pct}%,${a.amountUsd}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'numora-portfolio-allocation.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`bg-[#151517] border rounded-[5px] p-2.5 sm:p-3 flex flex-col transition-colors ${
        highlighted ? 'border-[#8E8E96]' : 'border-[#28282C]'
      }`}
      aria-label="Portfolio"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1] shrink-0">
            Portfolio
          </h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
          <button
            type="button"
            onClick={onOpenBuyModal}
            className="inline-flex items-center gap-1 px-2 py-[2px] text-[10px] font-medium text-[#E4E4E7] bg-[#1F1F23] hover:bg-[#2A2A30] border border-[#36363C] rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <CircleDollarSign className="w-2.5 h-2.5 text-[#B4B4BC]" />
            <span>Buy {symbol}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 relative shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
            title="Export portfolio CSV"
            aria-label="Export portfolio CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
              title="Portfolio options"
              aria-label="Portfolio options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} widthClass="w-44">
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(true);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#D4D4D8] hover:bg-[#222226] cursor-pointer"
              >
                Allocation Breakdown
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenBuyModal();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#D4D4D8] hover:bg-[#222226] cursor-pointer"
              >
                Simulate Buy Order
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadCsv();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#D4D4D8] hover:bg-[#222226] cursor-pointer"
              >
                Download CSV
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Three-Column Summary */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {PORTFOLIO_METRICS.map((m) => (
          <div key={m.label} className="min-w-0">
            <div className="text-[9.5px] text-[#7E7E85]">{m.label}</div>
            <div className="text-[13.5px] font-mono-num font-medium text-[#F1F1F1] truncate mt-0.5 leading-tight">
              {m.value}
            </div>
            <div
              className={`inline-flex items-center gap-0.5 text-[9px] font-mono-num mt-0.5 ${
                m.positive ? 'text-[#4D9E6E]' : 'text-[#C05656]'
              }`}
            >
              {m.positive ? (
                <ArrowUp className="w-2.5 h-2.5" />
              ) : (
                <ArrowDown className="w-2.5 h-2.5" />
              )}
              <span>{m.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dense Portfolio Allocation Grid (6 rows x 22 cols, column-major fill) */}
      <div
        className="grid grid-flow-col grid-rows-6 auto-cols-fr gap-[2.5px] mb-2.5"
        onMouseLeave={() => setHoveredAsset(null)}
      >
        {cells.map((cell) => {
          const dimmed = hoveredAsset !== null && hoveredAsset !== cell.symbol;
          return (
            <div
              key={cell.index}
              onMouseEnter={() => setHoveredAsset(cell.symbol)}
              style={{ backgroundColor: cell.shade }}
              className={`aspect-square w-full rounded-[1px] transition-opacity cursor-crosshair ${
                dimmed ? 'opacity-25' : 'opacity-100'
              }`}
              title={`${cell.symbol} allocation`}
            />
          );
        })}
      </div>

      {/* Asset Distribution Legend */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] font-mono-num">
        {PORTFOLIO_ALLOCATIONS.map((asset) => {
          const active = hoveredAsset === asset.symbol;
          return (
            <button
              key={asset.symbol}
              type="button"
              onMouseEnter={() => setHoveredAsset(asset.symbol)}
              onMouseLeave={() => setHoveredAsset(null)}
              onClick={() => setDetailsOpen(true)}
              className={`inline-flex items-center gap-1 cursor-pointer transition-opacity ${
                hoveredAsset && !active ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                style={{ backgroundColor: asset.shade }}
              />
              <span className="text-[#8E8E95]">{asset.symbol}</span>
              <span className="text-[#D8D8DE]">{asset.pct}%</span>
            </button>
          );
        })}
      </div>

      {/* Allocation Breakdown Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Portfolio Asset Allocation"
        subtitle="Demo wallet holdings distribution ($125,000 total)"
      >
        <div className="space-y-2">
          {PORTFOLIO_ALLOCATIONS.map((asset) => (
            <div
              key={asset.symbol}
              className="flex items-center justify-between px-3 py-2 bg-[#1A1A1D] border border-[#2A2A2E] rounded-[4px]"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-[1.5px]"
                  style={{ backgroundColor: asset.shade }}
                />
                <span className="text-[12px] font-medium text-[#F1F1F1]">{asset.symbol}</span>
              </div>
              <div className="flex items-center gap-4 font-mono-num text-[11px]">
                <span className="text-[#8E8E93]">{asset.amountUsd}</span>
                <span className="text-[#F1F1F1] w-12 text-right">{asset.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </section>
  );
};
