import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Download,
  MoreHorizontal,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import {
  ChatMessage,
  INITIAL_CHAT_MESSAGES,
} from '../data/demoData';
import {
  Ticker24hData,
  formatCompactUsd,
  formatMarketPrice,
} from '../services/binanceMarketService';
import { Dropdown } from './Dropdown';

interface AIAssistantProps {
  symbol: string;
  pair: string;
  ticker: Ticker24hData | null;
}

function generateDemoAssistantReply(
  prompt: string,
  symbol: string,
  pair: string,
  ticker: Ticker24hData | null
): string {
  const q = prompt.toLowerCase();

  if (q.includes('unlock') || q.includes('supply')) {
    return `Demo snapshot for ${symbol}: 33.98% is marked Unlocked, 13.85% Total Locked, and 52.17% TBD locked in the placeholder schedule. (Simulated demo summary, not live tokenomics.)`;
  }
  if (q.includes('holder') || q.includes('whale')) {
    return `In the ${symbol} demo cohort dataset, Holders represent 75%, Cruisers 20%, and Traders 5%, with whale wallets accounting for 98.47% of tracked demo supply.`;
  }
  if (q.includes('volume') || q.includes('buy') || q.includes('sell') || q.includes('ratio')) {
    const liveVolStr = ticker
      ? `Live Binance 24h quote volume on ${pair} is ${formatCompactUsd(ticker.quoteVolume)} across ${ticker.tradeCount.toLocaleString()} trades.`
      : `Live Binance 24h volume for ${pair} is currently loading.`;
    return `${liveVolStr} Long/Short ratio panel remains on placeholder demo data (not available from Spot API).`;
  }
  if (ticker) {
    const sign = ticker.priceChangePercent >= 0 ? '+' : '';
    return `Live Binance Spot telemetry for ${pair}: $${formatMarketPrice(ticker.price)} (24h ${sign}${ticker.priceChangePercent.toFixed(2)}%, high $${formatMarketPrice(ticker.highPrice)}, low $${formatMarketPrice(ticker.lowPrice)}). Local demo assistant summary — not a market forecast.`;
  }
  return `Live telemetry for ${pair} is currently unavailable or loading. Local demo assistant only — not a market forecast.`;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ symbol, pair, ticker }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [attachmentLabel, setAttachmentLabel] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const timestamp = nowTime();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: timestamp,
      attachment: attachmentLabel ?? undefined,
    };

    const replyText = generateDemoAssistantReply(trimmed, symbol, pair, ticker);
    const botMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      sender: 'assistant',
      text: replyText,
      time: timestamp,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    setAttachmentLabel(null);
  };

  const handleDownloadChat = () => {
    const content = messages
      .map((m) => `[${m.time}] ${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numora-assistant-${symbol.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="bg-[#151517] border border-[#28282C] rounded-[5px] flex flex-col flex-1 min-h-[235px]"
      aria-label="AI Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#242428]">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-[#D4D4D8]" />
          <h2 className="text-[12px] font-medium text-[#F1F1F1]">AI Assistant</h2>
          <span className="text-[9px] font-mono-num text-[#686870] shrink-0">
            DEMO
          </span>
        </div>
        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={handleDownloadChat}
            className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
            title="Export chat log"
            aria-label="Export chat log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1 text-[#84848B] hover:text-[#F1F1F1] rounded-[3px] cursor-pointer transition-colors"
              title="Assistant options"
              aria-label="Assistant options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <Dropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} widthClass="w-48">
              <button
                type="button"
                onClick={() => {
                  setInput(`Summarize ${symbol} holder cohorts & volume`);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#D4D4D8] hover:bg-[#222226] cursor-pointer"
              >
                Ask about {symbol} metrics
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages(INITIAL_CHAT_MESSAGES);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#D4D4D8] hover:bg-[#222226] cursor-pointer"
              >
                Reset demo thread
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[11px] text-[#929292] hover:bg-[#222226] hover:text-[#F1F1F1] cursor-pointer"
              >
                Clear chat
              </button>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Scrollable Chat History */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto terminal-scroll p-2.5 space-y-2.5 min-h-[150px] max-h-[260px] lg:max-h-[280px]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4 text-[10.5px] text-[#74747B]">
            Ask about {symbol} demo volume, holder cohorts, or unlock schedule.
          </div>
        ) : (
          messages.map((msg) =>
          msg.sender === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[88%] bg-[#212125] border border-[#2F2F35] rounded-[5px] px-2.5 py-1.5 text-[10.5px] leading-snug text-[#E8E8EC]">
                {msg.attachment && (
                  <div className="text-[9px] font-mono-num text-[#8E8E95] mb-1">
                    Attached: {msg.attachment}
                  </div>
                )}
                <div>{msg.text}</div>
                <div className="text-[8.5px] font-mono-num text-[#74747C] text-right mt-1">
                  {msg.time}
                </div>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[90%] bg-[#D9DFE2] border border-[#C6CDD1] rounded-[5px] px-2.5 py-2 text-[10.5px] leading-[1.42] text-[#141416]">
                <div>{msg.text}</div>
                <div className="text-[8.5px] font-mono-num text-[#5A6064] mt-1">
                  {msg.time}
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Attachment Preview Pill (only when user attaches snapshot) */}
      {attachmentLabel && (
        <div className="px-2.5 pb-1 flex items-center justify-between text-[9.5px] font-mono-num text-[#A1A1AA] bg-[#18181B] border-t border-[#252528] pt-1">
          <span className="truncate">Attached: {attachmentLabel}</span>
          <button
            type="button"
            onClick={() => setAttachmentLabel(null)}
            className="text-[#8E8E93] hover:text-[#F1F1F1] cursor-pointer"
            aria-label="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-2.5 py-2 border-t border-[#252528]"
      >
        <button
          type="button"
          onClick={() =>
            setAttachmentLabel((prev) =>
              prev ? null : `${symbol}_snapshot_demo.json`
            )
          }
          className={`transition-colors cursor-pointer shrink-0 ${
            attachmentLabel
              ? 'text-[#F1F1F1]'
              : 'text-[#78787F] hover:text-[#E4E4E7]'
          }`}
          title={`Attach ${symbol} demo snapshot`}
          aria-label="Attach context"
        >
          <Paperclip className="w-3.5 h-3.5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a message..."
          aria-label="Message AI Assistant"
          className="flex-1 min-w-0 bg-transparent text-[11px] text-[#F1F1F1] placeholder-[#74747B] focus:outline-none"
        />
        <button
          type="submit"
          className="text-[#D4D4D8] hover:text-[#FFFFFF] transition-colors cursor-pointer shrink-0"
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </section>
  );
};
