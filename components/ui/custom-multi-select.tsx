'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: { label: string; value: string }[];
  className?: string;
  placeholder?: string;
}

export function CustomMultiSelect({ value, onChange, options, className = '', placeholder = 'Select...' }: CustomMultiSelectProps) {
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

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const displayValue = value.length === options.length 
    ? 'All Locations' 
    : value.length > 0 
      ? value.map(v => options.find(o => o.value === v)?.label).join(', ') 
      : placeholder;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-[#111] p-2 bg-white focus:outline-none focus:border-[#ff4d94] hover:bg-[#fcfbf9] transition-colors"
      >
        <span className="text-[#111] text-sm truncate pr-4">{displayValue}</span>
        <ChevronDown size={16} className="text-[#111] shrink-0" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] z-[60] max-h-60 overflow-y-auto">
          {options.map(option => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-[#fcfbf9] transition-colors"
              >
                <span className="text-[#111]">{option.label}</span>
                <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#111] border-[#111]' : 'border-[#111] bg-white'}`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
