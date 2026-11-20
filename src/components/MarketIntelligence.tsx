import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDown, ArrowUp, Command, ExternalLink, Loader2,
  Plus, RefreshCw, Search, Star, Trash2, X,
} from 'lucide-react';
import { Modal } from './Modal';
import { MarketScreenerRow, fetchMarketScreener, formatMarketPrice } from '../services/binanceMarketService';

const WATCHLIST_KEY = 'numora.watchlist.v1';
const DEFAULT_WATCHLIST = ['SUIUSDT', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

function useMarketRows(enabled: boolean) {
  const [rows, setRows] = useState<MarketScreenerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let controller: AbortController | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      setLoading(true);
      try {
        const next = await fetchMarketScreener(controller.signal);
        if (!active) return;
        setRows(next);
        setError(null);
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Market data unavailable');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      controller?.abort();
    };
  }, [enabled, reloadNonce]);

  return { rows, loading, error, updatedAt, refresh: () => setReloadNonce((value) => value + 1) };
}

function money(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono-num ${positive ? 'text-[#A4BBAA]' : 'text-[#C58D8D]'}`}>
      {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

interface MarketWatchlistProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  onOpenScreener: () => void;
}

export const MarketWatchlist: React.FC<MarketWatchlistProps> = ({
  selectedPair, onSelectPair, onOpenScreener,
}) => {
  const [symbols, setSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string' && /^[A-Z0-9]{3,20}USDT$/.test(v)).slice(0, 12)
        : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const { rows, loading, error, updatedAt } = useMarketRows(true);

  useEffect(() => {
    try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols)); } catch { /* storage may be unavailable */ }
  }, [symbols]);

  const rowMap = useMemo(() => new Map(rows.map((row) => [row.pair, row])), [rows]);
  const addSymbol = () => {
    const clean = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return;
    const pair = clean.endsWith('USDT') ? clean : `${clean}USDT`;
    if (!rowMap.has(pair)) return;
    setSymbols((prev) => prev.includes(pair) ? prev : [...prev, pair].slice(-12));
    setQuery('');
    setAdding(false);
  };

  return (
    <section className="bg-[#111114] border border-[#303038] rounded-[7px] p-2.5 sm:p-3 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Star className="w-3.5 h-3.5 text-[#B7B7BE]" />
          <h2 className="text-[12px] font-semibold text-[#F4F4F5]">Watchlist</h2>
          <span className="text-[9px] font-mono-num text-[#71717A]">{symbols.length} ASSETS</span>
          {loading && <Loader2 className="w-3 h-3 text-[#8E8E93] animate-spin" />}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setAdding((v) => !v)} className="p-1 text-[#A1A1AA] hover:text-white" aria-label="Add watchlist token" title="Add token">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onOpenScreener} className="inline-flex items-center gap-1 text-[10px] text-[#A1A1AA] hover:text-white">
            Screener <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {adding && (
        <form onSubmit={(event) => { event.preventDefault(); addSymbol(); }} className="flex gap-1.5 mb-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} list="numora-watchlist-options" placeholder="Add token (e.g. SOL)" className="min-w-0 flex-1 bg-[#19191E] border border-[#38383F] rounded-[4px] px-2 py-1.5 text-[10px] text-white outline-none focus:border-[#666670]" />
          <datalist id="numora-watchlist-options">{rows.map((row) => <option key={row.pair} value={row.baseAsset} />)}</datalist>
          <button type="submit" className="px-2.5 bg-[#E4E4E7] text-[#111114] rounded-[4px] text-[10px] font-semibold">Add</button>
          <button type="button" onClick={() => { setAdding(false); setQuery(''); }} className="p-1.5 text-[#8E8E93]" aria-label="Cancel add"><X className="w-3.5 h-3.5" /></button>
        </form>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(75px,0.7fr)_minmax(72px,0.65fr)_20px] gap-2 px-1.5 pb-1.5 text-[9px] uppercase tracking-wide text-[#71717A] border-b border-[#292930]">
        <span>Asset</span><span className="text-right">Last price</span><span className="text-right">24h</span><span />
      </div>
      <div className="divide-y divide-[#24242A]">
        {symbols.map((symbol) => {
          const row = rowMap.get(symbol);
          const active = selectedPair === symbol;
          return (
            <div key={symbol} className={`grid grid-cols-[minmax(0,1fr)_minmax(75px,0.7fr)_minmax(72px,0.65fr)_20px] gap-2 items-center px-1.5 py-2 ${active ? 'bg-[#1B1B20]' : ''}`}>
              <button type="button" onClick={() => onSelectPair(symbol)} className="text-left min-w-0">
                <span className="block text-[11px] font-semibold text-[#E4E4E7]">{symbol.replace('USDT', '')}</span>
                <span className="block text-[9px] text-[#71717A]">USDT · Spot</span>
              </button>
              <span className="text-right font-mono-num text-[10px] text-[#D4D4D8]">{row ? `$${formatMarketPrice(row.price)}` : '—'}</span>
              <span className="text-right text-[10px]">{row ? <Change value={row.priceChangePercent} /> : <span className="text-[#71717A]">—</span>}</span>
              <button type="button" onClick={() => setSymbols((prev) => prev.filter((item) => item !== symbol))} className="p-1 text-[#62626B] hover:text-[#C58D8D]" aria-label={`Remove ${symbol} from watchlist`}><Trash2 className="w-3 h-3" /></button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 text-[9px] text-[#71717A]">
        <span>{error ? 'Market feed unavailable · retrying' : updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : 'Waiting for market data'}</span>
        <span>Auto-refresh 30s</span>
      </div>
    </section>
  );
};

interface MarketScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair: (pair: string) => void;
}

export const MarketScreenerModal: React.FC<MarketScreenerModalProps> = ({
  isOpen, onClose, onSelectPair,
}) => {
  const { rows, loading, error, updatedAt, refresh } = useMarketRows(isOpen);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Gainers' | 'Losers'>('All');
  const [sort, setSort] = useState<'volume' | 'change'>('volume');

  const filtered = useMemo(() => rows
    .filter((row) => row.baseAsset.includes(query.toUpperCase().trim()))
    .filter((row) => filter === 'All' || (filter === 'Gainers' ? row.priceChangePercent > 0 : row.priceChangePercent < 0))
    .sort((a, b) => sort === 'volume' ? b.quoteVolume - a.quoteVolume : b.priceChangePercent - a.priceChangePercent)
    .slice(0, 100), [rows, query, filter, sort]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="USDT Market Screener" subtitle="Live Binance Spot 24-hour market statistics · Refreshes every 30 seconds" maxWidthClass="max-w-3xl">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#19191E] border border-[#33333B] rounded-[4px] px-2.5">
            <Search className="w-3.5 h-3.5 text-[#777780]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter assets…" className="w-full min-w-0 bg-transparent py-2 text-[11px] text-white outline-none" />
          </div>
          <div className="flex gap-1">
            {(['All', 'Gainers', 'Losers'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`px-2.5 py-1.5 rounded-[4px] border text-[10px] ${filter === item ? 'bg-[#E4E4E7] text-[#111114] border-[#E4E4E7]' : 'bg-[#19191E] text-[#A1A1AA] border-[#33333B]'}`}>{item}</button>)}
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#71717A]">
          <span>{loading ? 'Loading market universe…' : `${filtered.length} markets shown`}</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-1 hover:text-white disabled:opacity-40"><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            <button type="button" onClick={() => setSort((v) => v === 'volume' ? 'change' : 'volume')} className="inline-flex items-center gap-1 hover:text-white">Sort: {sort === 'volume' ? 'Volume' : '24h Change'} <Activity className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto terminal-scroll border border-[#292930] rounded-[5px]">
          <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.9fr] gap-2 sticky top-0 bg-[#17171B] px-3 py-2 text-[9px] uppercase tracking-wide text-[#777780]">
            <span>Asset</span><span className="text-right">Price</span><span className="text-right">24h</span><span className="text-right">Volume</span>
          </div>
          {filtered.map((row) => (
            <button key={row.pair} type="button" onClick={() => { onSelectPair(row.pair); onClose(); }} className="w-full grid grid-cols-[1.1fr_1fr_0.8fr_0.9fr] gap-2 items-center px-3 py-2 border-t border-[#25252B] text-left hover:bg-[#202026]">
              <span className="text-[10.5px] font-semibold text-[#E4E4E7]">{row.baseAsset}<span className="text-[#71717A] font-normal"> / USDT</span></span>
              <span className="text-right text-[10px] font-mono-num text-[#D4D4D8]">${formatMarketPrice(row.price)}</span>
              <span className="text-right text-[10px]"><Change value={row.priceChangePercent} /></span>
              <span className="text-right text-[10px] font-mono-num text-[#A1A1AA]">{money(row.quoteVolume)}</span>
            </button>
          ))}
          {!loading && filtered.length === 0 && <div className="p-6 text-center text-[11px] text-[#8E8E93]">{error || 'No markets match this filter.'}</div>}
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#71717A]">
          <span>{error || (updatedAt ? `Last update ${new Date(updatedAt).toLocaleTimeString()}` : 'Data sourced from Binance Spot')}</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
      </div>
    </Modal>
  );
};

type CommandAction = 'screener' | 'signals' | 'alerts' | 'stake' | 'portfolio' | 'reset';
interface CommandPaletteProps { onAction: (action: CommandAction) => void; }

const COMMANDS: { id: CommandAction; title: string; detail: string; keys: string }[] = [
  { id: 'screener', title: 'Open Market Screener', detail: 'Search and rank USDT markets', keys: 'S' },
  { id: 'signals', title: 'Open AI Signals', detail: 'Review the signal feed', keys: 'A' },
  { id: 'alerts', title: 'Manage Smart Alerts', detail: 'Create and review price alerts', keys: 'L' },
  { id: 'stake', title: 'Open Staking Calculator', detail: 'Estimate staking rewards', keys: 'T' },
  { id: 'portfolio', title: 'Go to Portfolio', detail: 'View allocation summary', keys: 'P' },
  { id: 'reset', title: 'Reset Terminal', detail: 'Return to the default market view', keys: 'R' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onAction }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = COMMANDS.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery('');
        setActiveIndex(0);
      } else if (event.key === 'Escape') {
        setOpen(false);
      } else if (open && event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(0, matches.length - 1)));
      } else if (open && event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      } else if (open && event.key === 'Enter' && matches[activeIndex]) {
        event.preventDefault();
        onAction(matches[activeIndex].id);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, matches, activeIndex, onAction]);

  useEffect(() => { if (open) setActiveIndex(0); }, [query, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-3 pt-[12vh]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="w-full max-w-lg overflow-hidden rounded-[8px] border border-[#3A3A42] bg-[#111114] shadow-[0_24px_90px_rgba(0,0,0,.65)]">
        <div className="flex items-center gap-2 border-b border-[#292930] px-3 py-3">
          <Command className="w-4 h-4 text-[#8E8E93]" />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command…" className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none" />
          <kbd className="rounded border border-[#34343B] px-1.5 py-0.5 text-[9px] text-[#777780]">ESC</kbd>
        </div>
        <div className="p-1.5">
          {matches.map((item, index) => (
            <button key={item.id} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => { onAction(item.id); setOpen(false); }} className={`flex w-full items-center justify-between rounded-[5px] px-2.5 py-2 text-left ${activeIndex === index ? 'bg-[#24242A]' : 'hover:bg-[#1B1B20]'}`}>
              <span><span className="block text-[11px] text-[#E4E4E7]">{item.title}</span><span className="block mt-0.5 text-[9px] text-[#777780]">{item.detail}</span></span>
              <kbd className="rounded border border-[#34343B] px-1.5 py-0.5 text-[9px] text-[#777780]">{item.keys}</kbd>
            </button>
          ))}
          {matches.length === 0 && <div className="px-3 py-6 text-center text-[11px] text-[#777780]">No matching commands.</div>}
        </div>
        <div className="flex items-center justify-between border-t border-[#292930] px-3 py-2 text-[9px] text-[#71717A]"><span>NUMORA command center</span><span>↑ ↓ Navigate · ↵ Select</span></div>
      </div>
    </div>
  );
};
