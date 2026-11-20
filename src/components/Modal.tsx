import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-md',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidthClass} bg-[#151517] border border-[#303033] rounded-[6px] overflow-hidden text-[#F1F1F1]`}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2A2A2D]">
          <div className="min-w-0">
            <h2 className="text-[13px] font-medium text-[#F1F1F1] truncate">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-[#8E8E93] truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8E8E93] hover:text-[#F1F1F1] rounded-[4px] hover:bg-[#222226] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 max-h-[82vh] overflow-y-auto terminal-scroll">
          {children}
        </div>
      </div>
    </div>
  );
};
