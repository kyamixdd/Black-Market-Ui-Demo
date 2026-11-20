import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import {
  TradingPairInfo,
  extractBaseAsset,
  fetchExchangePairs,
} from '../services/binanceMarketService';

interface TokenSearchProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
}

const FALLBACK_POPULAR: TradingPairInfo[] = [
  { pair: 'SUIUSDT', baseAsset: 'SUI', quoteAsset: 'USDT', status: 'TRADING' },
  { pair: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
  { pair: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
  { pair: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING' },
  { pair: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', status: 'TRADING' },
  { pair: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', status: 'TRADING' },
];

export const TokenSearch: React.FC<TokenSearchProps> = ({
  selectedPair,
  onSelectPair,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [pairs, setPairs] = useState<TradingPairInfo[]>(FALLBACK_POPULAR);
  const [loadingPairs, setLoadingPairs] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingPairs(true);
    setLoadError(null);

    fetchExchangePairs(controller.signal)
      .then((list) => {
        if (!controller.signal.aborted && list.length > 0) {
          setPairs(list);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load Binance pairs');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingPairs(false);
        }
      });

    return () => controller.abort();
  }, []);

  const cleanQ = query.toUpperCase().trim();
  const filtered = cleanQ
    ? pairs
        .filter(
          (p) =>
            p.pair.includes(cleanQ) ||
            p.baseAsset.includes(cleanQ) ||
            `${p.baseAsset}/${p.quoteAsset}`.includes(cleanQ)
        )
        .slice(0, 40)
    : pairs.slice(0, 24);

  useEffect(() => {
    const handleSlash = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleSlash);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('keydown', handleSlash);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const handleSelect = (pair: string) => {
    onSelectPair(pair);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className="relative w-full md:max-w-[230px]">
      <div className="flex items-center h-[28px] bg-[#18181B] border border-[#2C2C30] focus-within:border-[#4A4A52] rounded-[5px] px-2 transition-colors">
        <Search className="w-3.5 h-3.5 text-[#7A7A80] shrink-0 mr-1.5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              inputRef.current?.blur();
            } else if (e.key === 'Enter' && filtered.length > 0) {
              e.preventDefault();
              handleSelect(filtered[0].pair);
            }
          }}
          placeholder={`Search any token (${extractBaseAsset(selectedPair)})`}
          aria-label="Search any token"
          className="w-full bg-transparent text-[11px] text-[#F1F1F1] placeholder-[#7A7A80] focus:outline-none"
        />
        {loadingPairs ? (
          <Loader2 className="w-3 h-3 text-[#7A7A80] animate-spin ml-1 shrink-0" />
        ) : (
          <span className="ml-1.5 px-1.5 py-[1px] text-[10px] font-mono-num text-[#7A7A80] bg-[#242428] border border-[#303034] rounded-[3px] shrink-0 select-none">
            /
          </span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#18181B] border border-[#303034] rounded-[6px] py-1 shadow-xl">
          <div className="px-2.5 py-1 text-[10px] text-[#7A7A80] border-b border-[#26262A] flex items-center justify-between">
            <span>Binance Spot Pairs ({pairs.length})</span>
            {loadError && <span className="text-[#C05656]">Cached</span>}
          </div>
          {filtered.length === 0 ? (
            <div className="px-2.5 py-2 text-[11px] text-[#8E8E93]">
              No supported Binance Spot pair matching &ldquo;{query.trim()}&rdquo;.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto terminal-scroll">
              {filtered.map((item) => {
                const isSelected = item.pair === selectedPair;
                return (
                  <button
                    key={item.pair}
                    type="button"
                    onClick={() => handleSelect(item.pair)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#242429] text-[#F1F1F1]'
                        : 'text-[#C8C8CE] hover:bg-[#202024]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-[#F1F1F1]">
                        {item.baseAsset}
                      </span>
                      <span className="text-[10px] font-mono-num text-[#7A7A80]">
                        /{item.quoteAsset}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-num text-[#8E8E95] shrink-0">
                      {item.pair}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
