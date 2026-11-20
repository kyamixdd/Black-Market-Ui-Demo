import React from 'react';

interface TimeframeSelectorProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm';
}

export function TimeframeSelector<T extends string>({
  options,
  value,
  onChange,
  size = 'xs',
}: TimeframeSelectorProps<T>) {
  return (
    <div className="inline-flex items-center gap-0.5" role="tablist" aria-label="Timeframe selector">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className={`whitespace-nowrap shrink-0 font-mono-num transition-colors cursor-pointer rounded-[3px] ${
              size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
            } ${
              active
                ? 'bg-[#212125] text-[#F1F1F1] border border-[#3E3E44]'
                : 'text-[#7C7C82] hover:text-[#D4D4D8] border border-transparent'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
