import React, { useEffect, useRef, useState } from 'react';
import { Header, NavSection } from './Header';
import { MarketChart } from './MarketChart';
import { TransactionsHeatmap } from './TransactionsHeatmap';
import { HoldersPanel } from './HoldersPanel';
import { BuySellVolume } from './BuySellVolume';
import { LongShortRatio } from './LongShortRatio';
import { PortfolioPanel } from './PortfolioPanel';
import { UnlocksPanel } from './UnlocksPanel';
import { AIAssistant } from './AIAssistant';
import { Modal } from './Modal';
import { AI_SIGNALS_DEMO } from '../data/demoData';
import { useBinanceMarket } from '../hooks/useBinanceMarket';
import {
  extractBaseAsset,
  formatMarketPrice,
} from '../services/binanceMarketService';
import { Check, Plus, Trash2 } from 'lucide-react';

interface SmartAlertItem {
  id: string;
  symbol: string;
  condition: string;
  target: string;
  enabled: boolean;
}

export const Dashboard: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<string>('SUIUSDT');
  const [activeNav, setActiveNav] = useState<NavSection>('Terminal');
  const [portfolioHighlighted, setPortfolioHighlighted] = useState(false);

  const market = useBinanceMarket(selectedPair, '1M');
  const baseAsset = extractBaseAsset(selectedPair);
  const livePrice = market.ticker?.price ?? null;

  // Modals
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [signalsModalOpen, setSignalsModalOpen] = useState(false);
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  // Buy Demo State
  const [buyUsd, setBuyUsd] = useState('500');
  const [buyOrderType, setBuyOrderType] = useState<'Market' | 'Limit'>('Market');
  const [buySuccess, setBuySuccess] = useState(false);

  // Stake Demo State
  const [stakeAmount, setStakeAmount] = useState('250');
  const [stakeDays, setStakeDays] = useState<30 | 90 | 180>(90);
  const [stakeSubmitted, setStakeSubmitted] = useState(false);

  // Smart Alerts Demo State
  const [alerts, setAlerts] = useState<SmartAlertItem[]>([
    { id: 'a1', symbol: 'SUI', condition: 'Price above', target: '$1.0000', enabled: true },
    { id: 'a2', symbol: 'SUI', condition: 'L/S Ratio >', target: '1.15', enabled: true },
  ]);
  const [newAlertTarget, setNewAlertTarget] = useState('');

  useEffect(() => {
    if (livePrice && livePrice > 0) {
      setNewAlertTarget(formatMarketPrice(livePrice * 1.05));
    } else {
      setNewAlertTarget('');
    }
  }, [selectedPair, livePrice]);

  const portfolioRef = useRef<HTMLDivElement>(null);

  const handleSelectNav = (nav: NavSection) => {
    setActiveNav(nav);
    if (nav === 'AI Signals') setSignalsModalOpen(true);
    else if (nav === 'Stake') {
      setStakeSubmitted(false);
      setStakeModalOpen(true);
    } else if (nav === 'Smart Alerts') setAlertsModalOpen(true);
    else if (nav === 'Portfolio') {
      setPortfolioHighlighted(true);
      portfolioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => setPortfolioHighlighted(false), 1800);
    }
  };

  const handleResetTerminal = () => {
    setSelectedPair('SUIUSDT');
    market.setTimeframe('1M');
    setActiveNav('Terminal');
    setBuyModalOpen(false);
    setSignalsModalOpen(false);
    setStakeModalOpen(false);
    setAlertsModalOpen(false);
  };

  const estimatedTokens =
    livePrice && livePrice > 0 && Number(buyUsd) > 0
      ? (Number(buyUsd) / livePrice).toFixed(4)
      : '—';

  const stakeApy = stakeDays === 30 ? 4.2 : stakeDays === 90 ? 6.8 : 9.4;
  const estReward =
    Number(stakeAmount) > 0
      ? ((Number(stakeAmount) * (stakeApy / 100) * stakeDays) / 365).toFixed(2)
      : '0.00';

  return (
    <div className="min-h-screen w-full bg-[#CBD2D4] flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-[1050px] bg-[#111113] border border-[#28282C] rounded-[6px] overflow-hidden shadow-[0_20px_50px_rgba(17,17,19,0.20)]">
        <Header
          selectedPair={selectedPair}
          onSelectPair={(pair) => {
            setSelectedPair(pair.toUpperCase().trim());
            setActiveNav('Terminal');
          }}
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          onResetTerminal={handleResetTerminal}
        />

        <main className="p-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-[1fr_296px] lg:gap-2 lg:items-stretch">
          {/* Left + Middle Primary Analytics Area (contents on <lg for intelligent mobile/tablet ordering) */}
          <div className="contents lg:flex lg:flex-col lg:gap-2 lg:min-w-0">
            {/* 1st on all viewports: Main Market Chart (Live Binance Spot REST + WS) */}
            <div className="order-1">
              <MarketChart
                pair={market.pair}
                timeframe={market.timeframe}
                onTimeframeChange={market.setTimeframe}
                ticker={market.ticker}
                candles={market.candles}
                loadingTicker={market.loadingTicker}
                loadingKlines={market.loadingKlines}
                tickerError={market.tickerError}
                klinesError={market.klinesError}
                connectionStatus={market.connectionStatus}
                lastUpdatedAt={market.lastUpdatedAt}
                onRetry={market.retryLoad}
                onReconnect={market.reconnectStream}
              />
            </div>

            {/* Middle Row: Transactions Heatmap (Demo) + Holders (Demo) */}
            <div className="order-3 md:order-2 grid grid-cols-1 md:grid-cols-[1.18fr_1fr] gap-2">
              <TransactionsHeatmap symbol={baseAsset} />
              <HoldersPanel symbol={baseAsset} />
            </div>

            {/* Bottom Row: Buys/Sells Volume (Live Binance Taker Flow) + Long/Short Ratio (Demo) */}
            <div className="order-4 md:order-3 grid grid-cols-1 md:grid-cols-[0.88fr_1.12fr] gap-2">
              <BuySellVolume
                pair={market.pair}
                marketTimeframe={market.timeframe}
                marketVolumeSummary={market.volumeSummary}
                marketLoading={market.loadingKlines}
                marketError={market.klinesError}
              />
              <LongShortRatio symbol={baseAsset} />
            </div>
          </div>

          {/* Right Sidebar: Portfolio (Demo) + Unlocks (Demo) + AI Assistant (Demo) */}
          <aside className="contents lg:flex lg:flex-col lg:gap-2 lg:min-w-0">
            <div className="contents md:grid md:grid-cols-2 md:gap-2 md:order-4 lg:contents">
              <div ref={portfolioRef} className="order-2 md:order-none">
                <PortfolioPanel
                  symbol={baseAsset}
                  onOpenBuyModal={() => {
                    setBuySuccess(false);
                    setBuyModalOpen(true);
                  }}
                  highlighted={portfolioHighlighted}
                />
              </div>
              <div className="order-5 md:order-none">
                <UnlocksPanel symbol={baseAsset} />
              </div>
            </div>
            <div className="order-6 md:order-5 lg:flex-1 lg:flex lg:flex-col">
              <AIAssistant
                symbol={baseAsset}
                pair={market.pair}
                ticker={market.ticker}
              />
            </div>
          </aside>
        </main>
      </div>

      {/* Buy Token Demo Modal */}
      <Modal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        title={`Buy ${baseAsset} (Demo Order)`}
        subtitle={
          livePrice
            ? `Simulated execution · Live ${selectedPair} $${formatMarketPrice(livePrice)}`
            : `Simulated execution · Waiting for live ${selectedPair} price`
        }
      >
        {buySuccess ? (
          <div className="py-4 text-center space-y-2">
            <div className="w-8 h-8 mx-auto rounded-full bg-[#1F2F25] border border-[#3B6B4D] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#4D9E6E]" />
            </div>
            <div className="text-[13px] font-medium text-[#F1F1F1]">
              Demo Order Recorded
            </div>
            <p className="text-[11px] text-[#929292] font-mono-num">
              {buyOrderType} buy · {estimatedTokens} {baseAsset} (${buyUsd})
            </p>
            <button
              type="button"
              onClick={() => setBuyModalOpen(false)}
              className="mt-2 px-4 py-1.5 bg-[#EAEAEB] text-[#111113] text-[11px] font-medium rounded-[4px] hover:bg-white cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!livePrice) return;
              setBuySuccess(true);
            }}
            className="space-y-3"
          >
            <div className="flex items-center gap-1 p-0.5 bg-[#1B1B1E] border border-[#2C2C30] rounded-[4px]">
              {(['Market', 'Limit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBuyOrderType(t)}
                  className={`flex-1 py-1 text-[11px] rounded-[3px] cursor-pointer ${
                    buyOrderType === t
                      ? 'bg-[#26262B] text-[#F1F1F1] font-medium'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10.5px] text-[#8E8E93] mb-1">
                Amount (USD)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={buyUsd}
                onChange={(e) => setBuyUsd(e.target.value)}
                className="w-full bg-[#1B1B1E] border border-[#2E2E33] rounded-[4px] px-2.5 py-1.5 text-[12px] font-mono-num text-[#F1F1F1] focus:outline-none focus:border-[#52525B]"
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                {['100', '500', '1000', '2500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBuyUsd(preset)}
                    className="px-2 py-0.5 text-[10px] font-mono-num bg-[#1D1D21] border border-[#2D2D32] rounded-[3px] text-[#A1A1AA] hover:text-[#F1F1F1] cursor-pointer"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1D] border border-[#27272B] rounded-[4px] px-3 py-2 flex items-center justify-between text-[11px] font-mono-num">
              <span className="text-[#8E8E93]">Estimated {baseAsset}</span>
              <span className="text-[#F1F1F1]">
                {estimatedTokens} {baseAsset}
              </span>
            </div>

            <button
              type="submit"
              disabled={!livePrice}
              className="w-full py-2 bg-[#EAEAEB] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#111113] text-[11.5px] font-semibold rounded-[4px] transition-colors cursor-pointer"
            >
              {livePrice
                ? `Place Demo ${buyOrderType} Order`
                : 'Waiting for Live Price...'}
            </button>
          </form>
        )}
      </Modal>

      {/* AI Signals Modal */}
      <Modal
        isOpen={signalsModalOpen}
        onClose={() => {
          setSignalsModalOpen(false);
          setActiveNav('Terminal');
        }}
        title="AI Signals Feed (Demo)"
        subtitle="Demo heuristic signal feed · Click a row to load live Binance Spot chart"
        maxWidthClass="max-w-lg"
      >
        <div className="divide-y divide-[#242428]">
          {AI_SIGNALS_DEMO.map((sig) => (
            <button
              key={sig.token}
              type="button"
              onClick={() => {
                setSelectedPair(`${sig.token}USDT`);
                setSignalsModalOpen(false);
                setActiveNav('Terminal');
              }}
              className="w-full flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-[#1C1C20] rounded-[4px] text-left cursor-pointer transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#F1F1F1]">
                    {sig.token}/USDT
                  </span>
                  <span className="text-[10.5px] text-[#B4B4BC]">{sig.bias}</span>
                </div>
                <div className="text-[10.5px] text-[#7E7E85] mt-0.5">{sig.trigger}</div>
              </div>
              <div className="text-right font-mono-num shrink-0">
                <div className="text-[10.5px] text-[#D4D4D8]">{sig.confidence}</div>
                <div className="text-[9.5px] text-[#74747B]">{sig.time}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Stake Modal */}
      <Modal
        isOpen={stakeModalOpen}
        onClose={() => {
          setStakeModalOpen(false);
          setActiveNav('Terminal');
        }}
        title={`Stake ${baseAsset} (Demo Calculator)`}
        subtitle="Simulated validator lock-up estimator"
      >
        {stakeSubmitted ? (
          <div className="py-4 text-center space-y-2">
            <div className="text-[13px] font-medium text-[#F1F1F1]">
              Demo Stake Preview Confirmed
            </div>
            <p className="text-[11px] font-mono-num text-[#929292]">
              {stakeAmount} {baseAsset} locked for {stakeDays} days · Est. +{estReward}{' '}
              {baseAsset}
            </p>
            <button
              type="button"
              onClick={() => {
                setStakeModalOpen(false);
                setActiveNav('Terminal');
              }}
              className="mt-2 px-4 py-1.5 bg-[#EAEAEB] text-[#111113] text-[11px] font-medium rounded-[4px] cursor-pointer"
            >
              Return to Terminal
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStakeSubmitted(true);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-[10.5px] text-[#8E8E93] mb-1">
                Amount ({baseAsset})
              </label>
              <input
                type="number"
                min="1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full bg-[#1B1B1E] border border-[#2E2E33] rounded-[4px] px-2.5 py-1.5 text-[12px] font-mono-num text-[#F1F1F1] focus:outline-none"
              />
            </div>
            <div>
              <div className="text-[10.5px] text-[#8E8E93] mb-1">Lock Duration</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([30, 90, 180] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setStakeDays(days)}
                    className={`py-1.5 text-[11px] font-mono-num rounded-[4px] border cursor-pointer ${
                      stakeDays === days
                        ? 'bg-[#242429] border-[#4A4A52] text-[#F1F1F1]'
                        : 'bg-[#19191C] border-[#29292E] text-[#8E8E93]'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#1A1A1D] border border-[#27272B] rounded-[4px] p-2.5 space-y-1 text-[11px] font-mono-num">
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">Demo APY</span>
                <span className="text-[#4D9E6E]">{stakeApy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">Projected Yield</span>
                <span className="text-[#F1F1F1]">
                  +{estReward} {baseAsset}
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#EAEAEB] hover:bg-white text-[#111113] text-[11.5px] font-semibold rounded-[4px] cursor-pointer"
            >
              Simulate Stake
            </button>
          </form>
        )}
      </Modal>

      {/* Smart Alerts Modal */}
      <Modal
        isOpen={alertsModalOpen}
        onClose={() => {
          setAlertsModalOpen(false);
          setActiveNav('Terminal');
        }}
        title="Smart Alerts (Demo)"
        subtitle="Configure local demo price and ratio triggers"
      >
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAlertTarget.trim()) return;
              setAlerts((prev) => [
                ...prev,
                {
                  id: `a-${Date.now()}`,
                  symbol: baseAsset,
                  condition: 'Price crosses',
                  target: `$${newAlertTarget.trim()}`,
                  enabled: true,
                },
              ]);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newAlertTarget}
              onChange={(e) => setNewAlertTarget(e.target.value)}
              placeholder="Target price"
              className="flex-1 bg-[#1B1B1E] border border-[#2E2E33] rounded-[4px] px-2.5 py-1.5 text-[11.5px] font-mono-num text-[#F1F1F1] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EAEAEB] text-[#111113] text-[11px] font-semibold rounded-[4px] cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add {baseAsset}</span>
            </button>
          </form>

          <div className="divide-y divide-[#242428] border border-[#26262A] rounded-[4px]">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="flex items-center justify-between px-3 py-2 text-[11px]"
              >
                <div>
                  <span className="font-semibold text-[#F1F1F1] mr-2">{al.symbol}</span>
                  <span className="text-[#929292]">{al.condition} </span>
                  <span className="font-mono-num text-[#E4E4E7]">{al.target}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAlerts((prev) =>
                        prev.map((x) =>
                          x.id === al.id ? { ...x, enabled: !x.enabled } : x
                        )
                      )
                    }
                    className={`px-2 py-0.5 text-[10px] font-mono-num rounded-[3px] border cursor-pointer ${
                      al.enabled
                        ? 'bg-[#212126] border-[#42424A] text-[#F1F1F1]'
                        : 'bg-[#171719] border-[#2A2A2E] text-[#6E6E75]'
                    }`}
                  >
                    {al.enabled ? 'ACTIVE' : 'PAUSED'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAlerts((prev) => prev.filter((x) => x.id !== al.id))
                    }
                    className="text-[#74747B] hover:text-[#C05656] cursor-pointer"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
