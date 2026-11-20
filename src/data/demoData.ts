export type MarketTimeframe = '1D' | '7D' | '1M' | '1Y' | 'All';
export type HeatmapTimeframe = '1D' | '7D' | '1M' | 'All';
export type LongShortTimeframe = '24H' | '1D' | '7D' | 'All';
export type CohortTab = 'Time Held' | 'Holdings' | 'Whale';

export interface CandlePoint {
  index: number;
  time: string;
  axisLabel?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma7?: number;
  ema20?: number;
}

export interface TokenProfile {
  symbol: string;
  name: string;
  contract: string;
  fullContract: string;
  price: number;
  change24h: number;
  marketCap: number;
  supply: number;
  peakLabel: number;
}

export interface HeatmapCell {
  row: number;
  col: number;
  level: 0 | 1 | 2 | 3 | 4;
  txCount: number;
  dateLabel: string;
}

export interface VolumeBarPoint {
  month: string;
  buy: number;
  sell: number;
}

export interface VolumeDataset {
  txns: string;
  vol: string;
  chainFees: string;
  netBuy: string;
  netBuyPositive: boolean;
  bars: VolumeBarPoint[];
}

export interface LongShortPoint {
  label: string;
  fullTime: string;
  longPct: number;
  shortPct: number;
  ratio: number;
}

export interface HoldersDataset {
  cruisers: number;
  holders: number;
  traders: number;
  whales: string;
  others: string;
  bars: { idx: number; tier: 'cruiser' | 'holder' | 'trader'; addresses: number; share: string }[];
  topAddresses: { address: string; tag: string; balance: string; pct: string; holdingDays: number }[];
}

export interface UnlocksDataset {
  centerPct: number;
  centerLabel: string;
  segments: {
    key: string;
    label: string;
    value: number;
    display: string;
    pattern?: 'solid-dark' | 'striped' | 'solid-light' | 'muted';
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  attachment?: string;
}

export const USER_PROFILE = {
  name: 'Nollan',
  shortAddress: '0x4a7B...Cef1',
  fullAddress: '0x4a7B92c8E10F3d94B8a122e9045aCef1',
  avatarUrl: '/src/assets/images/avatar_nollan_1795164539811.jpg',
};

export const TOKENS: Record<string, TokenProfile> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui Network',
    contract: '0x0000...i::sui',
    fullContract: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    price: 7.552,
    change24h: 2.8,
    marketCap: 21450000000,
    supply: 2840307203,
    peakLabel: 8.492,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    contract: '0xC02a...6Cc2',
    fullContract: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    price: 3428.4,
    change24h: 1.94,
    marketCap: 412800000000,
    supply: 120406020,
    peakLabel: 3684.5,
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    contract: 'bc1q...9x4k',
    fullContract: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    price: 94210.0,
    change24h: -0.62,
    marketCap: 1865000000000,
    supply: 19796199,
    peakLabel: 97480.0,
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    contract: 'So11...1112',
    fullContract: 'So11111111111111111111111111111111111111112',
    price: 218.65,
    change24h: 4.15,
    marketCap: 103900000000,
    supply: 475188657,
    peakLabel: 234.8,
  },
  UNI: {
    symbol: 'UNI',
    name: 'Uniswap',
    contract: '0x1f98...F984',
    fullContract: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    price: 14.82,
    change24h: -1.35,
    marketCap: 8890000000,
    supply: 599865047,
    peakLabel: 16.4,
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    contract: '0x912C...B490',
    fullContract: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    price: 1.462,
    change24h: 3.12,
    marketCap: 5980000000,
    supply: 4090287278,
    peakLabel: 1.624,
  },
};

// Carefully shaped candle sequence matching the SUI 1M reference visual profile
const SUI_1M_CANDLES_RAW: [number, number, number, number, number, string, string?][] = [
  [6.78, 6.95, 6.64, 6.86, 182000, '09:30', '10am'],
  [6.86, 7.22, 6.82, 7.16, 294000, '10:00'],
  [7.16, 7.21, 6.92, 6.97, 211000, '10:30'],
  [6.97, 7.14, 6.91, 7.11, 165000, '11:00'],
  [7.11, 7.42, 7.08, 7.36, 338000, '11:30'],
  [7.36, 7.62, 7.24, 7.59, 412000, '12:00'],
  [7.59, 7.64, 7.21, 7.28, 289000, '12:30'],
  [7.28, 7.39, 7.10, 7.14, 198000, '13:00'],
  [7.14, 7.31, 7.05, 7.07, 174000, '13:30'],
  [7.07, 7.34, 7.04, 7.29, 241000, '14:00', '2pm'],
  [7.29, 7.38, 7.18, 7.22, 187000, '14:30'],
  [7.22, 7.46, 7.19, 7.42, 265000, '15:00'],
  [7.42, 7.63, 7.38, 7.58, 354000, '15:30'],
  [7.58, 7.61, 7.28, 7.31, 224000, '16:00'],
  [7.31, 7.36, 7.02, 7.06, 251000, '16:30'],
  [7.06, 7.25, 7.00, 7.21, 208000, '17:00'],
  [7.21, 7.24, 6.72, 6.77, 342000, '17:30'],
  [6.77, 6.91, 6.69, 6.84, 195000, '18:00', '6pm'],
  [6.84, 7.06, 6.79, 6.94, 219000, '18:30'],
  [6.94, 7.02, 6.76, 6.81, 176000, '19:00'],
  [6.81, 6.96, 6.74, 6.89, 162000, '19:30'],
  [6.89, 7.19, 6.85, 7.15, 278000, '20:00'],
  [7.15, 7.18, 6.86, 6.89, 214000, '20:30'],
  [6.89, 6.92, 6.62, 6.65, 293000, '21:00'],
  [6.65, 6.74, 6.53, 6.57, 248000, '21:30'],
  [6.57, 6.72, 6.51, 6.68, 226000, '22:00', '10pm'],
  [6.68, 6.95, 6.64, 6.91, 319000, '22:30'],
  [6.91, 7.24, 6.88, 7.18, 394000, '23:00'],
  [7.18, 8.21, 7.15, 8.08, 682000, '23:30'],
  [8.08, 8.26, 7.82, 7.91, 514000, '00:00'],
  [7.91, 8.492, 7.74, 7.79, 645000, '00:30'],
  [7.79, 7.86, 7.12, 7.18, 439000, '01:00'],
  [7.18, 7.36, 6.94, 7.01, 298000, '01:30'],
  [7.01, 7.12, 6.82, 6.88, 256000, '02:00', '2am'],
  [6.88, 7.04, 6.83, 6.96, 204000, '02:30'],
  [6.96, 7.01, 6.79, 6.84, 189000, '03:00'],
  [6.84, 6.95, 6.75, 6.81, 172000, '03:30'],
  [6.81, 6.88, 6.60, 6.68, 234000, '04:00'],
  [6.68, 6.86, 6.64, 6.79, 198000, '04:30'],
  [6.79, 7.16, 6.76, 7.12, 312000, '05:00'],
  [7.12, 7.64, 7.08, 7.56, 468000, '05:30'],
  [7.56, 7.72, 7.44, 7.63, 351000, '06:00', '6am'],
  [7.63, 7.84, 7.58, 7.78, 389000, '06:30'],
  [7.78, 8.08, 7.72, 7.96, 442000, '07:00'],
  [7.96, 8.34, 7.91, 8.18, 521000, '07:30'],
  [8.18, 8.24, 7.71, 7.76, 396000, '08:00'],
  [7.76, 7.82, 7.68, 7.72, 224000, '08:30'],
  [7.72, 7.88, 7.69, 7.83, 241000, '09:00'],
  [7.83, 7.94, 7.76, 7.89, 267000, '09:30'],
  [7.89, 7.93, 7.71, 7.75, 215000, '10:00'],
  [7.75, 7.82, 7.62, 7.66, 194000, '10:30'],
  [7.66, 7.74, 7.52, 7.58, 218000, '11:00'],
  [7.58, 7.66, 7.46, 7.51, 184000, '11:30'],
  [7.51, 7.62, 7.45, 7.59, 205000, '12:00'],
  [7.59, 7.71, 7.54, 7.68, 229000, '12:30'],
  [7.68, 7.79, 7.61, 7.73, 254000, '13:00'],
  [7.73, 7.78, 7.36, 7.42, 318000, '13:30'],
  [7.42, 7.74, 7.39, 7.69, 344000, '14:00'],
  [7.69, 7.76, 7.58, 7.64, 246000, '14:30'],
  [7.64, 7.71, 7.51, 7.552, 271000, '15:00'],
];

function addIndicators(candles: CandlePoint[]): CandlePoint[] {
  let ema = candles[0]?.close ?? 0;
  const k = 2 / (20 + 1);
  return candles.map((c, idx) => {
    const start = Math.max(0, idx - 6);
    const slice = candles.slice(start, idx + 1);
    const ma7 = slice.reduce((acc, item) => acc + item.close, 0) / slice.length;
    ema = c.close * k + ema * (1 - k);
    return {
      ...c,
      ma7: Number(ma7.toFixed(4)),
      ema20: Number(ema.toFixed(4)),
    };
  });
}

function generateScaledCandles(
  token: TokenProfile,
  timeframe: MarketTimeframe
): CandlePoint[] {
  const basePrice = TOKENS.SUI.price;
  const ratio = token.price / basePrice;

  const tfConfig: Record<
    MarketTimeframe,
    { volatility: number; drift: number; labels: string[] }
  > = {
    '1D': {
      volatility: 0.55,
      drift: 0.04,
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    },
    '7D': {
      volatility: 0.85,
      drift: 0.12,
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    '1M': {
      volatility: 1.0,
      drift: 0.0,
      labels: ['10am', '2pm', '6pm', '10pm', '2am', '6am'],
    },
    '1Y': {
      volatility: 1.45,
      drift: -0.25,
      labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    },
    All: {
      volatility: 1.8,
      drift: -0.45,
      labels: ['2022', '2023', '2024', '2025', '2026', 'Now'],
    },
  };

  const cfg = tfConfig[timeframe];
  const labelIndices = [0, 9, 17, 25, 33, 41];

  const mapped: CandlePoint[] = SUI_1M_CANDLES_RAW.map((raw, idx) => {
    const [o, h, l, c, vol, timeStr, rawAxis] = raw;
    const mid = 7.35;
    const tfWave =
      timeframe === '1M'
        ? 0
        : Math.sin(idx * 0.28 + timeframe.length) * 0.18 * cfg.volatility +
          ((idx / SUI_1M_CANDLES_RAW.length) - 0.5) * cfg.drift;

    const transform = (val: number) => {
      const delta = (val - mid) * cfg.volatility + mid + tfWave;
      return Number((Math.max(0.05, delta) * ratio).toFixed(token.price > 100 ? 2 : 4));
    };

    const open = transform(o);
    const close = idx === SUI_1M_CANDLES_RAW.length - 1 ? token.price : transform(c);
    const high = Math.max(open, close, transform(h));
    const low = Math.min(open, close, transform(l));

    const labelPos = labelIndices.indexOf(idx);
    const axisLabel =
      timeframe === '1M'
        ? rawAxis
        : labelPos !== -1
          ? cfg.labels[labelPos]
          : undefined;

    return {
      index: idx,
      time: timeframe === '1M' ? timeStr : `${cfg.labels[Math.min(5, Math.floor(idx / 10))]} · ${timeStr}`,
      axisLabel,
      open,
      high,
      low,
      close,
      volume: Math.round(vol * (0.8 + cfg.volatility * 0.4) * (token.symbol === 'BTC' ? 3.2 : 1)),
    };
  });

  return addIndicators(mapped);
}

export function getMarketCandles(symbol: string, timeframe: MarketTimeframe): CandlePoint[] {
  const token = TOKENS[symbol] ?? TOKENS.SUI;
  return generateScaledCandles(token, timeframe);
}

// Heatmap generator (7 rows x 23 cols) matching the screenshot's monochrome density clusters
const HEATMAP_MONTHS = ['Sep', 'Dec', 'Nov', 'Oct', 'Aug', 'Jul'];

const BASE_HEATMAP_1M: number[][] = [
  [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 2, 0, 0, 1, 0],
  [1, 1, 0, 2, 1, 4, 2, 0, 1, 1, 0, 1, 2, 0, 1, 3, 1, 0, 1, 1],
  [3, 1, 0, 1, 1, 2, 4, 1, 0, 4, 0, 2, 3, 0, 0, 4, 1, 0, 1, 0],
  [0, 0, 2, 0, 4, 1, 2, 1, 0, 2, 1, 1, 2, 1, 0, 2, 1, 1, 1, 1],
  [0, 1, 4, 0, 1, 0, 4, 1, 0, 4, 1, 4, 0, 0, 0, 4, 0, 0, 2, 1],
  [0, 1, 2, 0, 0, 1, 3, 4, 0, 2, 1, 2, 1, 0, 0, 1, 0, 1, 3, 0],
  [1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 2, 0, 1, 4, 1, 0, 1, 4, 1, 0],
];

export function getHeatmapData(
  symbol: string,
  timeframe: HeatmapTimeframe
): { cells: HeatmapCell[]; cols: number; rows: number; months: string[] } {
  const seedOffset = symbol.charCodeAt(0) + timeframe.length * 3;
  const rows = 7;
  const cols = 20;
  const cells: HeatmapCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let level = BASE_HEATMAP_1M[r][c] as 0 | 1 | 2 | 3 | 4;
      if (symbol !== 'SUI' || timeframe !== '1M') {
        const hash = (r * 31 + c * 17 + seedOffset) % 11;
        if (timeframe === '1D') {
          level = (hash > 8 ? 4 : hash > 6 ? 3 : hash > 4 ? 2 : hash > 1 ? 1 : 0) as 0 | 1 | 2 | 3 | 4;
        } else if (timeframe === '7D') {
          level = ((level + (hash % 2)) % 5) as 0 | 1 | 2 | 3 | 4;
        } else if (timeframe === 'All') {
          level = Math.min(4, level + (hash % 3 === 0 ? 1 : 0)) as 0 | 1 | 2 | 3 | 4;
        } else {
          level = ((level + (hash % 3 === 0 ? 1 : 0)) % 5) as 0 | 1 | 2 | 3 | 4;
        }
      }
      const monthLabel = HEATMAP_MONTHS[Math.min(5, Math.floor((c / cols) * 6))];
      const txCount = level === 0 ? 410 + ((r * 7 + c * 13) % 240) : level * 1450 + ((r * 83 + c * 47) % 690);
      cells.push({
        row: r,
        col: c,
        level,
        txCount,
        dateLabel: `${monthLabel} · Slot ${r + 1}:${c + 1}`,
      });
    }
  }

  return { cells, cols, rows, months: HEATMAP_MONTHS };
}

export function getHoldersData(symbol: string, tab: CohortTab): HoldersDataset {
  const tokenMult = symbol === 'SUI' ? 1 : symbol === 'BTC' ? 1.4 : 0.85;
  const baseByTab: Record<CohortTab, { cruisers: number; holders: number; traders: number; whales: string; others: string }> = {
    'Time Held': {
      cruisers: 20,
      holders: 75,
      traders: 5,
      whales: '98.47%',
      others: '1.53%',
    },
    Holdings: {
      cruisers: 14,
      holders: 68,
      traders: 18,
      whales: '91.20%',
      others: '8.80%',
    },
    Whale: {
      cruisers: 8,
      holders: 84,
      traders: 8,
      whales: '99.12%',
      others: '0.88%',
    },
  };

  const selected = baseByTab[tab];
  const totalBars = 42;
  const cruiserEnd = Math.round((selected.cruisers / 100) * totalBars);
  const traderStart = totalBars - Math.max(2, Math.round((selected.traders / 100) * totalBars));

  const bars = Array.from({ length: totalBars }, (_, idx) => {
    const tier: 'cruiser' | 'holder' | 'trader' =
      idx < cruiserEnd ? 'cruiser' : idx >= traderStart ? 'trader' : 'holder';
    return {
      idx,
      tier,
      addresses: Math.round((1250 + ((idx * 173) % 840)) * tokenMult),
      share: `${(0.4 + ((idx * 19) % 28) / 10).toFixed(2)}%`,
    };
  });

  const topAddresses = [
    { address: '0x91f8...42a0', tag: 'Foundation Treasury', balance: `142.8M ${symbol}`, pct: '28.40%', holdingDays: 412 },
    { address: '0x3b71...8e91', tag: 'Validator Pool #04', balance: `89.2M ${symbol}`, pct: '17.75%', holdingDays: 386 },
    { address: '0x7c02...19d4', tag: 'Institutional Custody', balance: `64.5M ${symbol}`, pct: '12.83%', holdingDays: 304 },
    { address: '0x54a9...0f22', tag: 'Ecosystem Liquidity', balance: `38.1M ${symbol}`, pct: '7.58%', holdingDays: 215 },
    { address: '0x1e66...c7b8', tag: 'Long-Term Whale', balance: `19.4M ${symbol}`, pct: '3.86%', holdingDays: 198 },
  ];

  return {
    ...selected,
    bars,
    topAddresses,
  };
}

export function getVolumeData(symbol: string, timeframe: MarketTimeframe): VolumeDataset {
  const mult = symbol === 'SUI' ? 1 : symbol === 'BTC' ? 2.4 : symbol === 'ETH' ? 1.8 : 0.72;
  const byTf: Record<MarketTimeframe, VolumeDataset> = {
    '1D': {
      txns: `${Math.round(12480 * mult).toLocaleString()}`,
      vol: `${Math.round(38 * mult)}M$`,
      chainFees: `${(0.54 * mult).toFixed(2)}M$`,
      netBuy: `+${Math.round(4120 * mult).toLocaleString()}$`,
      netBuyPositive: true,
      bars: [
        { month: 'Sep', buy: 12000, sell: 8400 },
        { month: 'Dec', buy: 9500, sell: 14200 },
        { month: 'Nov', buy: 7800, sell: 11800 },
        { month: 'Oct', buy: 6200, sell: 13400 },
        { month: 'Aug', buy: 11400, sell: 15800 },
      ],
    },
    '7D': {
      txns: `${Math.round(28910 * mult).toLocaleString()}`,
      vol: `${Math.round(92 * mult)}M$`,
      chainFees: `${(1.35 * mult).toFixed(1)}M$`,
      netBuy: `+${Math.round(9840 * mult).toLocaleString()}$`,
      netBuyPositive: true,
      bars: [
        { month: 'Sep', buy: 14800, sell: 10200 },
        { month: 'Dec', buy: 13200, sell: 16800 },
        { month: 'Nov', buy: 9400, sell: 14600 },
        { month: 'Oct', buy: 7100, sell: 16200 },
        { month: 'Aug', buy: 13600, sell: 18400 },
      ],
    },
    '1M': {
      txns: symbol === 'SUI' ? '45,447' : `${Math.round(45447 * mult).toLocaleString()}`,
      vol: symbol === 'SUI' ? '150M$' : `${Math.round(150 * mult)}M$`,
      chainFees: symbol === 'SUI' ? '2.1M$' : `${(2.1 * mult).toFixed(1)}M$`,
      netBuy: symbol === 'SUI' ? '+15,256$' : `+${Math.round(15256 * mult).toLocaleString()}$`,
      netBuyPositive: true,
      bars: [
        { month: 'Sep', buy: 16800, sell: 9200 },
        { month: 'Dec', buy: 11600, sell: 19400 },
        { month: 'Nov', buy: 8200, sell: 16600 },
        { month: 'Oct', buy: 5200, sell: 18800 },
        { month: 'Aug', buy: 12400, sell: 21200 },
      ],
    },
    '1Y': {
      txns: `${Math.round(384200 * mult).toLocaleString()}`,
      vol: `${Math.round(1180 * mult)}M$`,
      chainFees: `${(16.8 * mult).toFixed(1)}M$`,
      netBuy: `+${Math.round(112400 * mult).toLocaleString()}$`,
      netBuyPositive: true,
      bars: [
        { month: 'Sep', buy: 18400, sell: 15200 },
        { month: 'Dec', buy: 16200, sell: 18900 },
        { month: 'Nov', buy: 13800, sell: 17400 },
        { month: 'Oct', buy: 11200, sell: 19600 },
        { month: 'Aug', buy: 17500, sell: 20400 },
      ],
    },
    All: {
      txns: `${Math.round(912450 * mult).toLocaleString()}`,
      vol: `${Math.round(3420 * mult)}M$`,
      chainFees: `${(42.5 * mult).toFixed(1)}M$`,
      netBuy: `-8,420$`,
      netBuyPositive: false,
      bars: [
        { month: 'Sep', buy: 15600, sell: 16200 },
        { month: 'Dec', buy: 14100, sell: 19800 },
        { month: 'Nov', buy: 12200, sell: 18100 },
        { month: 'Oct', buy: 9800, sell: 20100 },
        { month: 'Aug', buy: 16400, sell: 21600 },
      ],
    },
  };

  return byTf[timeframe];
}

export function getLongShortData(symbol: string, timeframe: LongShortTimeframe): LongShortPoint[] {
  const shift = symbol === 'SUI' ? 0 : (symbol.charCodeAt(0) % 7) - 3;

  const base7D: LongShortPoint[] = [
    { label: '5 Jul', fullTime: '5 Jul 2025, 00:00', longPct: 62.1, shortPct: 37.9, ratio: 0.99 },
    { label: '', fullTime: '5 Jul 2025, 12:00', longPct: 57.4, shortPct: 42.6, ratio: 0.97 },
    { label: '6 Jul', fullTime: '6 Jul 2025, 00:00', longPct: 68.5, shortPct: 31.5, ratio: 1.03 },
    { label: '', fullTime: '6 Jul 2025, 12:00', longPct: 52.8, shortPct: 47.2, ratio: 0.95 },
    { label: '7 Jul', fullTime: '7 Jul 2025, 00:00', longPct: 46.2, shortPct: 53.8, ratio: 0.92 },
    { label: '', fullTime: '7 Jul 2025, 12:00', longPct: 31.5, shortPct: 68.5, ratio: 0.87 },
    { label: '8 Jul', fullTime: '8 Jul 2025, 00:00', longPct: 8.4, shortPct: 91.6, ratio: 0.81 },
    { label: '', fullTime: '8 Jul 2025, 12:00', longPct: 19.6, shortPct: 80.4, ratio: 0.84 },
    { label: '9 Jul', fullTime: '9 Jul 2025, 00:00', longPct: 32.8, shortPct: 67.2, ratio: 0.90 },
    { label: '', fullTime: '9 Jul 2025, 12:00', longPct: 41.2, shortPct: 58.8, ratio: 0.98 },
    { label: '10 Jul', fullTime: '10 Jul 2025, 8:00', longPct: 43.42, shortPct: 56.58, ratio: 1.1052 },
    { label: '', fullTime: '10 Jul 2025, 16:00', longPct: 87.6, shortPct: 12.4, ratio: 1.16 },
    { label: '11 Jul', fullTime: '11 Jul 2025, 00:00', longPct: 89.4, shortPct: 10.6, ratio: 1.17 },
    { label: '', fullTime: '11 Jul 2025, 12:00', longPct: 56.2, shortPct: 43.8, ratio: 1.04 },
  ];

  const tfLabels: Record<LongShortTimeframe, string[]> = {
    '24H': ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    '1D': ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00', 'Now'],
    '7D': ['5 Jul', '6 Jul', '7 Jul', '8 Jul', '9 Jul', '10 Jul', '11 Jul'],
    All: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  };

  return base7D.map((pt, i) => {
    const labelIdx = i % 2 === 0 ? Math.floor(i / 2) : -1;
    const label = labelIdx >= 0 ? tfLabels[timeframe][labelIdx] ?? pt.label : '';
    const mod = timeframe === '7D' && shift === 0 ? 0 : Math.sin(i + timeframe.length + shift) * 6;
    const longPct = Number(Math.max(5, Math.min(95, pt.longPct + mod)).toFixed(2));
    const shortPct = Number((100 - longPct).toFixed(2));
    const ratio = Number(Math.max(0.8, Math.min(1.2, pt.ratio + mod * 0.008)).toFixed(4));
    return {
      label,
      fullTime: timeframe === '7D' ? pt.fullTime : `${label || 'Mid'} · Demo`,
      longPct,
      shortPct,
      ratio,
    };
  });
}

export interface PortfolioAllocationItem {
  symbol: string;
  pct: number;
  shade: string;
  amountUsd: string;
}

export const PORTFOLIO_METRICS = [
  { label: 'Today', value: '3,585$', change: '25.50%', positive: true },
  { label: 'Month', value: '12,005$', change: '5.50%', positive: false },
  { label: 'Year', value: '125,000$', change: '25.50%', positive: true },
];

export const PORTFOLIO_ALLOCATIONS: PortfolioAllocationItem[] = [
  { symbol: 'USDT', pct: 35, shade: '#EAEAEB', amountUsd: '$43,750' },
  { symbol: 'ETH', pct: 32.5, shade: '#8E8E94', amountUsd: '$40,625' },
  { symbol: 'SUI', pct: 20.5, shade: '#525258', amountUsd: '$25,625' },
  { symbol: 'UNI', pct: 10.2, shade: '#2B2B2F', amountUsd: '$12,750' },
];

// 6 rows x 22 cols = 132 square cells (column-major fill matching screenshot)
export function getPortfolioGridCells(allocations: PortfolioAllocationItem[]): { index: number; symbol: string; shade: string }[] {
  const total = 132;
  const cells: { index: number; symbol: string; shade: string }[] = [];
  const usdtCount = Math.round((allocations[0].pct / 100) * total);
  const ethCount = Math.round((allocations[1].pct / 100) * total);
  const suiCount = Math.round((allocations[2].pct / 100) * total);

  for (let i = 0; i < total; i++) {
    let item = allocations[3];
    if (i < usdtCount) item = allocations[0];
    else if (i < usdtCount + ethCount) item = allocations[1];
    else if (i < usdtCount + ethCount + suiCount) item = allocations[2];

    cells.push({
      index: i,
      symbol: item.symbol,
      shade: item.shade,
    });
  }
  return cells;
}

export function getUnlocksData(symbol: string, tab: CohortTab): UnlocksDataset {
  if (tab === 'Time Held') {
    return {
      centerPct: 34,
      centerLabel: 'Unlocked',
      segments: [
        { key: 'totalLocked', label: 'Total Locked', value: 13.85, display: '13.85%', pattern: 'solid-dark' },
        { key: 'tbdLocked', label: 'TBD locked', value: 52.17, display: '52.17%', pattern: 'striped' },
        { key: 'unlocked', label: 'Unlocked', value: 33.98, display: '33.98%', pattern: 'solid-light' },
        { key: 'untracked', label: 'Untracked', value: 0.0, display: '0.00%', pattern: 'muted' },
      ],
    };
  }
  if (tab === 'Holdings') {
    return {
      centerPct: symbol === 'BTC' ? 93 : 42,
      centerLabel: 'Unlocked',
      segments: [
        { key: 'totalLocked', label: 'Total Locked', value: 18.4, display: '18.40%', pattern: 'solid-dark' },
        { key: 'tbdLocked', label: 'TBD locked', value: 39.6, display: '39.60%', pattern: 'striped' },
        { key: 'unlocked', label: 'Unlocked', value: 42.0, display: '42.00%', pattern: 'solid-light' },
        { key: 'untracked', label: 'Untracked', value: 0.0, display: '0.00%', pattern: 'muted' },
      ],
    };
  }
  return {
    centerPct: 28,
    centerLabel: 'Unlocked',
    segments: [
      { key: 'totalLocked', label: 'Total Locked', value: 24.15, display: '24.15%', pattern: 'solid-dark' },
      { key: 'tbdLocked', label: 'TBD locked', value: 47.85, display: '47.85%', pattern: 'striped' },
      { key: 'unlocked', label: 'Unlocked', value: 28.0, display: '28.00%', pattern: 'solid-light' },
      { key: 'untracked', label: 'Untracked', value: 0.0, display: '0.00%', pattern: 'muted' },
    ],
  };
}

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'user',
    text: 'Give me a forecast for the SUI coin',
    time: '15:01',
  },
  {
    id: 'm2',
    sender: 'assistant',
    text: 'Sure! SUI is currently trading at $7.55, with a 24h change of +2.8%. Based on recent trends and volume inflows, short-term momentum appears bullish.',
    time: '15:01',
  },
];

export const NOTIFICATIONS_DEMO = [
  {
    id: 'n1',
    title: 'SUI Whale Accumulation',
    detail: 'Top 50 addresses added 1.42M SUI in the last 4h.',
    time: '12m ago',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Long/Short Ratio Cross',
    detail: 'SUI L/S ratio crossed 1.10 threshold on demo perp feed.',
    time: '48m ago',
    unread: true,
  },
  {
    id: 'n3',
    title: 'Unlock Schedule Reminder',
    detail: 'Next scheduled epoch unlock window opens in 6 days.',
    time: '3h ago',
    unread: false,
  },
];

export const AI_SIGNALS_DEMO = [
  { token: 'SUI', bias: 'Accumulation', confidence: 'Demo · High', trigger: '$7.42 support hold', time: '14:55' },
  { token: 'ETH', bias: 'Neutral Range', confidence: 'Demo · Medium', trigger: '$3,410 VWAP pivot', time: '14:32' },
  { token: 'SOL', bias: 'Momentum', confidence: 'Demo · High', trigger: 'Volume +24% vs 7D avg', time: '13:48' },
  { token: 'ARB', bias: 'Compression', confidence: 'Demo · Low', trigger: 'Volatility squeeze', time: '12:15' },
];
