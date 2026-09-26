'use client';

/**
 * @file SearchableSelect.js
 * @description Premium searchable dropdown component with real-time text search,
 * keyboard accessibility, custom option support, and responsive floating menu.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search options...',
  disabled = false,
  error = '',
  className = '',
  dropdownClassName = '',
  allowCustom = false,
  customOptionLabel = '+ Custom Option...',
  customOptionValue = 'CUSTOM',
  name = '',
  id = '',
  renderTrigger = null,
  align = 'left'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options into uniform { value, label, subtext, flag } shape
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: String(opt), label: String(opt) };
      }
      return {
        value: String(opt.value !== undefined ? opt.value : opt._id || opt.id || opt.label || ''),
        label: String(opt.label || opt.name || opt.title || opt.value || ''),
        subtext: opt.subtext || opt.country || '',
        flag: opt.flag || '',
        isCustomTrigger: opt.isCustomTrigger || opt.value === customOptionValue
      };
    });
  }, [options, customOptionValue]);

  // Find currently selected option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === String(value)) || null;
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subtext ? opt.subtext.toLowerCase().includes(q) : false;
      const matchVal = opt.value.toLowerCase().includes(q);
      return matchLabel || matchSub || matchVal;
    });
  }, [normalizedOptions, searchQuery]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value, opt);
    }
    setIsOpen(false);
  };

  const handleCustomSelect = () => {
    if (onChange) {
      onChange(customOptionValue, { value: customOptionValue, label: customOptionLabel });
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full text-left"
      onKeyDown={handleKeyDown}
      id={id ? `${id}-container` : undefined}
    >
      {/* Trigger Button */}
      {renderTrigger ? (
        <div
          id={id}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={className || 'cursor-pointer'}
        >
          {renderTrigger({ selectedOption, isOpen, disabled })}
        </div>
      ) : (
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-foreground transition-all cursor-pointer select-none focus:outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            error
              ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5'
              : isOpen
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-primary/40 focus:ring-2 focus:ring-primary'
          } ${className}`}
        >
          <span className="truncate text-left font-medium">
            {selectedOption ? (
              <span className="flex items-center gap-1.5 truncate">
                {selectedOption.flag && <span className="text-sm shrink-0">{selectedOption.flag}</span>}
                <span className="truncate">{selectedOption.label}</span>
                {selectedOption.subtext && (
                  <span className="text-xs text-muted-foreground ml-1">({selectedOption.subtext})</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground/60">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-2 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </button>
      )}

      {/* Floating Dropdown Menu with Search */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 z-50 w-full min-w-[240px] max-w-full rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {/* Search Box Header */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-background rounded-lg border border-border pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options Scrollable List */}
          <div ref={listRef} className="max-h-64 overflow-y-auto p-1 text-xs space-y-0.5 overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <p className="font-medium text-xs">No matching options found</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Try searching with a different keyword</p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption?.value === opt.value;
                return (
                  <button
                    key={opt.value + opt.label}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground hover:bg-muted/70 hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.flag && <span className="text-sm shrink-0">{opt.flag}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.subtext && (
                        <span className="text-[11px] text-muted-foreground/70 shrink-0">({opt.subtext})</span>
                      )}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}

            {/* Custom Option Button at Bottom if Enabled */}
            {allowCustom && (
              <div className="pt-1 mt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={handleCustomSelect}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-primary font-bold hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <span>{customOptionLabel}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
