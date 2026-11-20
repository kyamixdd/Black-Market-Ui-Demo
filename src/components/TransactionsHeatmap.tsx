import React, { useMemo, useState } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { HeatmapCell, HeatmapTimeframe, getHeatmapData } from '../data/demoData';
import { TimeframeSelector } from './TimeframeSelector';
import { Modal } from './Modal';

interface TransactionsHeatmapProps {
  symbol: string;
}

const HEATMAP_TFS: readonly HeatmapTimeframe[] = ['1D', '7D', '1M', 'All'];

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: '#202024',
  1: '#3A3A40',
  2: '#63636A',
  3: '#9E9EA6',
  4: '#EAEAEB',
};

export const TransactionsHeatmap: React.FC<TransactionsHeatmapProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState<HeatmapTimeframe>('1M');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const { cells, cols, months } = useMemo(
    () => getHeatmapData(symbol, timeframe),
    [symbol, timeframe]
  );

  const handleDownloadCsv = () => {
    const header = 'row,col,date_slot,activity_level,tx_count\n';
    const rows = cells
      .map((c) => `${c.row},${c.col},"${c.dateLabel}",${c.level},${c.txCount}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol.toLowerCase()}-transactions-heatmap-${timeframe.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderGrid = (cellGapClass: string, cellRadiusClass: string) => (
    <div className="relative">
      <div
        className={`grid ${cellGapClass}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((cell) => (
          <div
            key={`${cell.row}-${cell.col}`}
            onMouseEnter={() => setHoveredCell(cell)}
            onMouseLeave={() => setHoveredCell(null)}
            style={{ backgroundColor: LEVEL_COLORS[cell.level] }}
            className={`aspect-square w-full ${cellRadiusClass} transition-opacity hover:opacity-80 cursor-crosshair`}
            title={`${cell.dateLabel}: ${cell.txCount.toLocaleString()} txns`}
          />
        ))}
      </div>

      {/* Month Labels */}
      <div className="flex items-center justify-between px-3 pt-2 text-[9.5px] font-mono-num text-[#7E7E85]">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] p-2.5 sm:p-3 flex flex-col justify-between"
      aria-label="Transactions Heatmap"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-[12px] font-medium text-[#F1F1F1] truncate">
            Transactions Heatmap
          </h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
          {hoveredCell && (
            <span className="hidden sm:inline-block text-[10px] font-mono-num text-[#8E8E93] truncate">
              {hoveredCell.txCount.toLocaleString()} txns
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <TimeframeSelector
            options={HEATMAP_TFS}
            value={timeframe}
            onChange={setTimeframe}
          />
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
            title="Download heatmap CSV"
            aria-label="Download heatmap CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
            title="Fullscreen heatmap"
            aria-label="Fullscreen heatmap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Heatmap Matrix */}
      {renderGrid('gap-[2.5px] sm:gap-[3.5px]', 'rounded-[1.5px]')}

      {/* Fullscreen Modal */}
      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        title={`${symbol} — Transactions Heatmap (${timeframe})`}
        subtitle="Demo network transaction intensity matrix"
        maxWidthClass="max-w-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <TimeframeSelector
            options={HEATMAP_TFS}
            value={timeframe}
            onChange={setTimeframe}
            size="sm"
          />
          <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93]">
            <span>Low</span>
            {([0, 1, 2, 3, 4] as const).map((lvl) => (
              <span
                key={lvl}
                className="w-3 h-3 rounded-[2px] inline-block"
                style={{ backgroundColor: LEVEL_COLORS[lvl] }}
              />
            ))}
            <span>High</span>
          </div>
        </div>
        {renderGrid('gap-1.5', 'rounded-[2px]')}
        <div className="mt-3 pt-2 border-t border-[#26262A] flex items-center justify-between text-[11px] font-mono-num text-[#929292]">
          <span>
            {hoveredCell
              ? `${hoveredCell.dateLabel} · ${hoveredCell.txCount.toLocaleString()} transactions`
              : 'Hover over any cell to inspect slot volume'}
          </span>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1 text-[#E4E4E7] hover:underline cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </Modal>
    </section>
  );
};
