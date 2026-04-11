'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string | number }[];
  name?: string;
  className?: string;
}

export function CustomSelect({ value, onChange, options, name, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div className="relative" ref={ref}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border border-[#111] p-2 bg-white focus:outline-none focus:border-[#ff4d94] hover:bg-[#fcfbf9] transition-colors ${className}`}
      >
        <span className="text-[#111] text-sm">{selectedOption?.label}</span>
        <ChevronDown size={16} className="text-[#111]" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-[60] max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => {
                onChange(String(option.value));
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-[#fcfbf9] transition-colors"
            >
              <span className="text-[#111]">{option.label}</span>
              {String(value) === String(option.value) && <Check size={14} className="text-[#ff4d94]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
