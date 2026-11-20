import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Copy,
  Check,
  Menu,
  X,
  Activity,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { TokenSearch } from './TokenSearch';
import { Dropdown } from './Dropdown';
import { NOTIFICATIONS_DEMO, USER_PROFILE } from '../data/demoData';

export type NavSection = 'Terminal' | 'AI Signals' | 'Stake' | 'Portfolio' | 'Smart Alerts';

interface HeaderProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  onResetTerminal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPair,
  onSelectPair,
  activeNav,
  onSelectNav,
  onResetTerminal,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DEMO);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [imgError, setImgError] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const navItems: NavSection[] = ['AI Signals', 'Stake', 'Portfolio', 'Smart Alerts'];

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(USER_PROFILE.fullAddress).catch(() => {});
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="border-b border-[#242428] bg-[#111113] select-none">
      <div className="flex items-center justify-between px-3 sm:px-4 h-[50px] gap-3">
        {/* Left: Brand + Search + Desktop Nav */}
        <div className="flex items-center gap-5 min-w-0 flex-1">
          <button
            type="button"
            onClick={onResetTerminal}
            className="flex items-center gap-2 shrink-0 cursor-pointer group"
            title="Numora Terminal"
          >
            {/* Geometric 6-spoke starburst logo matching screenshot */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#F1F1F1] shrink-0"
              aria-hidden="true"
            >
              <path
                d="M12 2.5V8.2M12 15.8V21.5M3.8 7.25L8.75 10.1M15.25 13.9L20.2 16.75M20.2 7.25L15.25 10.1M8.75 13.9L3.8 16.75"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M9.4 4.1L12 6.8L14.6 4.1M9.4 19.9L12 17.2L14.6 19.9M4.2 10.1L7.3 12L4.2 13.9M19.8 10.1L16.7 12L19.8 13.9"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[14.5px] font-semibold tracking-tight text-[#F1F1F1] whitespace-nowrap">
              Numora
            </span>
          </button>

          <div className="hidden md:flex items-center gap-5 flex-1 min-w-0">
            <TokenSearch
              selectedPair={selectedPair}
              onSelectPair={onSelectPair}
            />

            <nav className="flex items-center gap-4 lg:gap-5" aria-label="Primary navigation">
              {navItems.map((item) => {
                const isActive = activeNav === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onSelectNav(item)}
                    className={`text-[11.5px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b ${
                      isActive
                        ? 'text-[#F1F1F1] border-[#F1F1F1]'
                        : 'text-[#8C8C92] hover:text-[#E4E4E7] border-transparent'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right: Notifications + Profile + Mobile toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileOpen(false);
              }}
              className="relative p-1.5 text-[#A1A1A8] hover:text-[#F1F1F1] hover:bg-[#1C1C20] rounded-[4px] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#E4E4E7]" />
              )}
            </button>

            <Dropdown isOpen={notifOpen} onClose={() => setNotifOpen(false)} widthClass="w-72">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#27272B]">
                <span className="text-[11px] font-medium text-[#F1F1F1]">
                  Terminal Alerts ({unreadCount})
                </span>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[10px] text-[#8E8E93] hover:text-[#F1F1F1] cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto terminal-scroll divide-y divide-[#242428]">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                      )
                    }
                    className="w-full text-left px-3 py-2 hover:bg-[#212125] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-medium ${
                          n.unread ? 'text-[#F1F1F1]' : 'text-[#929292]'
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[9.5px] font-mono-num text-[#6F6F76] shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-[#8A8A90] mt-0.5 leading-snug">
                      {n.detail}
                    </p>
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 py-1 px-1.5 rounded-[5px] hover:bg-[#1B1B1E] transition-colors cursor-pointer"
              aria-label="User menu"
            >
              <div className="w-[26px] h-[26px] rounded-[4px] overflow-hidden bg-[#27272A] border border-[#323236] shrink-0 flex items-center justify-center">
                {!imgError ? (
                  <img
                    src={USER_PROFILE.avatarUrl}
                    alt={USER_PROFILE.name}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-medium text-[#E4E4E7]">N</span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight text-left">
                <span className="text-[11.5px] font-medium text-[#F1F1F1] whitespace-nowrap">
                  {USER_PROFILE.name}
                </span>
                <span className="text-[9.5px] font-mono-num text-[#7E7E85] whitespace-nowrap">
                  {USER_PROFILE.shortAddress}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7E7E85] hidden sm:block" />
            </button>

            <Dropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} widthClass="w-56">
              <div className="px-3 py-2 border-b border-[#27272B]">
                <div className="text-[11.5px] font-medium text-[#F1F1F1]">{USER_PROFILE.name}</div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] font-mono-num text-[#8A8A90]">
                    {USER_PROFILE.shortAddress}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center gap-1 text-[10px] text-[#A1A1AA] hover:text-[#F1F1F1] cursor-pointer"
                  >
                    {copiedAddr ? (
                      <>
                        <Check className="w-3 h-3 text-[#4D9E6E]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectNav('Portfolio');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#C8C8CE] hover:bg-[#222226] hover:text-[#F1F1F1] cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-[#8A8A90]" />
                <span>Portfolio Summary</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectNav('Smart Alerts');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#C8C8CE] hover:bg-[#222226] hover:text-[#F1F1F1] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#8A8A90]" />
                <span>Manage Alerts</span>
              </button>
              <div className="border-t border-[#27272B] mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onResetTerminal();
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#929292] hover:bg-[#222226] hover:text-[#F1F1F1] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#8A8A90]" />
                  <span>Reset Demo Session</span>
                </button>
              </div>
            </Dropdown>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((m) => !m)}
            className="md:hidden p-1.5 text-[#A1A1A8] hover:text-[#F1F1F1] hover:bg-[#1C1C20] rounded-[4px] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-3 pb-3 pt-2 border-t border-[#252528] space-y-2.5 bg-[#131315]">
          <TokenSearch
            selectedPair={selectedPair}
            onSelectPair={(nextPair) => {
              onSelectPair(nextPair);
              setMobileMenuOpen(false);
            }}
          />
          <nav className="flex flex-wrap items-center gap-2" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onSelectNav(item);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-[4px] border cursor-pointer ${
                    isActive
                      ? 'bg-[#212125] border-[#3E3E44] text-[#F1F1F1]'
                      : 'bg-[#18181B] border-[#2A2A2E] text-[#929292] hover:text-[#F1F1F1]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
