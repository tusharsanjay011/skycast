import { useState, useEffect, useRef } from "react";

/**
 * City search input with debounced Open-Meteo geocoding suggestions,
 * keyboard navigation (ArrowUp/ArrowDown/Enter/Escape), and a "Use my location" button.
 */
export default function SearchBar({
  searchCities,
  onSelectCity,
  onUseMyLocation,
  locating,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);

  // Close the dropdown when clicking outside the search bar
  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounce city lookups by 300ms so we don't fire an API call on every keystroke
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const { results, error, aborted } = await searchCities(trimmed, controller.signal);
      if (aborted) return;

      setSuggestions(results);
      setSearchError(error);
      setIsSearching(false);
      setIsOpen(true);
      setActiveIndex(results.length > 0 ? 0 : -1);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchCities]);

  function handlePickCity(city) {
    setQuery("");
    setSuggestions([]);
    setSearchError(null);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelectCity({
      id: city.id || `${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`,
      name: city.name,
      admin1: city.admin1 || "",
      country: city.country || "",
      latitude: city.latitude,
      longitude: city.longitude,
    });
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[activeIndex >= 0 ? activeIndex : 0];
      if (chosen) handlePickCity(chosen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="search-section" ref={containerRef}>
      <div className="search-row">
        <div className="search-input-wrap">
          <label htmlFor="city-search-input" className="sr-only">
            Search for a city
          </label>
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            id="city-search-input"
            type="text"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || searchError) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search city (e.g. London, Tokyo, Mumbai)..."
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="city-suggestions-list"
            aria-activedescendant={
              activeIndex >= 0 ? `city-option-${activeIndex}` : undefined
            }
          />
          {isSearching && (
            <span className="input-spinner" aria-label="Searching cities" />
          )}
          {query && !isSearching && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setSearchError(null);
                setIsOpen(false);
              }}
              aria-label="Clear search text"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="button"
          className="location-btn"
          onClick={onUseMyLocation}
          disabled={locating}
          aria-label="Use my current location"
        >
          {locating ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">📍</span>
              <span>Use my location</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="suggestions-dropdown" id="city-suggestions-list" role="listbox">
          {searchError ? (
            <div className="suggestion-message" role="status">
              {searchError}
            </div>
          ) : (
            suggestions.map((city, idx) => {
              const regionParts = [city.admin1, city.country].filter(Boolean).join(", ");
              return (
                <button
                  key={city.id || `${city.name}-${city.latitude}-${city.longitude}`}
                  id={`city-option-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`suggestion-item ${idx === activeIndex ? "is-active" : ""}`}
                  onClick={() => handlePickCity(city)}
                >
                  <span className="suggestion-name">{city.name}</span>
                  {regionParts && (
                    <span className="suggestion-region">{regionParts}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
