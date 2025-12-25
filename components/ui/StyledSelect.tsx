
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StyledSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !filter) return options;
    return options.filter(o =>
      o.label.toLowerCase().includes(filter.toLowerCase()) ||
      o.description?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [options, filter, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFilter('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFilter('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border rounded-lg p-2.5 flex items-center justify-between transition-all ${disabled ? 'cursor-not-allowed opacity-50 border-slate-800' : 'cursor-pointer'} ${!disabled && isOpen ? 'border-cyan-500 ring-1 ring-cyan-500/20' : !disabled ? 'border-slate-700 hover:border-slate-600' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span className="text-sm text-white">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                <input
                  type="text"
                  autoFocus
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-900/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {option.icon && (
                        <div className={`p-1.5 rounded ${isSelected ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                          {option.icon}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{option.description}</div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-600 italic">No options found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyledSelect;
