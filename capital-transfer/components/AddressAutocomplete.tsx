'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X, LocateFixed } from 'lucide-react';

interface Suggestion {
  label: string;
  value: string;
  coordinates: [number, number]; // [lat, lon]
}

interface AddressAutocompleteProps {
  placeholder: string;
  value: string;
  onChange: (value: string, coordinates?: [number, number]) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Pin control on the pickup field: geolocate instead of a passive icon */
  onGeolocate?: () => void;
  geolocateLoading?: boolean;
  geolocateAriaLabel?: string;
  /** When false, no trailing pin when the field is empty (e.g. arrival address). */
  showEmptyStateIcon?: boolean;
}

export default function AddressAutocomplete({ 
  placeholder, 
  value, 
  onChange, 
  className,
  style,
  onGeolocate,
  geolocateLoading = false,
  geolocateAriaLabel = 'Use my location',
  showEmptyStateIcon = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Using API ADRESSE (French Gov) for maximum precision in France
      // https://adresse.data.gouv.fr/api-doc/adresse
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();

      const newSuggestions: Suggestion[] = (data?.features || []).map((f: any) => {
        const p = f.properties;
        const coords = f.geometry.coordinates; // [lon, lat]
        
        return {
          label: p.label,
          value: p.label,
          coordinates: [coords[1], coords[0]] // [lat, lon]
        };
      });

      setSuggestions(newSuggestions);
      setIsOpen(newSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 150); // Reduced for "real-time" feel
  };

  const handleSelect = (suggestion: Suggestion) => {
    setInputValue(suggestion.label);
    setSuggestions([]);
    setIsOpen(false);
    onChange(suggestion.label, suggestion.coordinates);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    onChange('');
  };

  // Helper to highlight matching text
  const renderHighlightedLabel = (label: string, query: string) => {
    if (!query) return label;
    const parts = label.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <b key={i} style={{ color: '#D4AF37' }}>{part}</b> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const hasGeolocate = Boolean(onGeolocate);
  const inputPaddingRight = hasGeolocate
    ? isLoading || inputValue
      ? 88
      : 52
    : isLoading || inputValue
      ? 44
      : showEmptyStateIcon
        ? 44
        : 16;

  return (
    <div ref={containerRef} className="relative w-full" style={style}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full outline-none text-neutral-100 placeholder:text-neutral-400 transition-colors ${className}`}
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0',
            padding: '16px 20px',
            paddingRight: inputPaddingRight,
            color: '#FFFFFF',
            fontSize: '15px',
            lineHeight: 1.45,
            minWidth: 0,
          }}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {hasGeolocate && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onGeolocate?.();
              }}
              disabled={geolocateLoading || isLoading}
              title={geolocateAriaLabel}
              aria-label={geolocateAriaLabel}
              className="shrink-0 p-1.5 text-neutral-400 transition-colors hover:bg-white/5 hover:text-[#E8C547] disabled:pointer-events-none disabled:opacity-40"
            >
              {geolocateLoading ? (
                <Loader2 className="animate-spin text-[#D4AF37]" size={18} aria-hidden />
              ) : (
                <LocateFixed size={19} strokeWidth={2} className="text-[#C9A84C]" aria-hidden />
              )}
            </button>
          )}
          {isLoading && (
            <Loader2 className="size-4 shrink-0 animate-spin text-[#D4AF37]" aria-hidden />
          )}
          {!isLoading && inputValue ? (
            <button
              onClick={clearInput}
              type="button"
              className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-200"
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          ) : !isLoading && !inputValue && !hasGeolocate && showEmptyStateIcon ? (
            <MapPin size={16} className="text-neutral-400" aria-hidden />
          ) : null}
        </div>
      </div>

      {isOpen && (
        <div className="autocomplete-dropdown absolute z-[100] w-full min-w-0 max-w-full sm:min-w-[280px] mt-2 overflow-hidden rounded-none border border-white/10 bg-[#1A1A1A] shadow-2xl backdrop-blur-xl">
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-5 py-4 cursor-pointer flex items-center gap-4 transition-colors ${
                  activeIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex-shrink-0">
                  <MapPin size={18} className={activeIndex === index ? 'text-[#D4AF37]' : 'text-neutral-400'} aria-hidden />
                </div>
                <div className="flex-grow">
                  <div className="text-white text-[15px] font-medium leading-relaxed">
                    {renderHighlightedLabel(suggestion.label, inputValue)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2" style={{ color: '#A3A3A3' }}>
                    <span className="h-1 w-1 shrink-0 rounded-none bg-[#D4AF37]/40" />
                    {suggestion.label.includes(',') ? suggestion.label.split(',').pop()?.trim() : 'France'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-2 border-t border-white/5 bg-black/20 flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Sélectionnez une adresse</span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#A3A3A3' }}>
              Data Gouv FR
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .autocomplete-dropdown {
          animation: slideDown 200ms ease-out;
          box-shadow: 0 10px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        b {
          color: #D4AF37 !important;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
