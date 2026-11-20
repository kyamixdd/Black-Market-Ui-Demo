import React, { useEffect, useRef } from 'react';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  widthClass?: string;
  children: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  align = 'right',
  widthClass = 'w-56',
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const container = ref.current?.parentElement ?? ref.current;
      if (container && !container.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={`absolute top-full mt-1.5 ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${widthClass} z-50 bg-[#18181B] border border-[#303034] rounded-[6px] py-1 text-[#F1F1F1] shadow-lg`}
      role="menu"
    >
      {children}
    </div>
  );
};
