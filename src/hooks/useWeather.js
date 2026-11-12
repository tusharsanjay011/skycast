import { useState, useRef, useCallback } from "react";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes to avoid redundant API calls

/**
 * Turns a fetch failure into a friendly, user-facing message.
 */
function getFriendlyError(err) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Please check your internet connection and try again.";
  }
  if (err && err.name === "TypeError") {
    return "Unable to reach the weather service. Please check your internet connection.";
  }
  return err?.message || "Something went wrong while loading the weather. Please try again.";
}

/**
 * Finds the starting index in hourly.time that matches (or follows) current.time.
 */
function findCurrentHourIndex(hourlyTimes, currentTime) {
  if (!Array.isArray(hourlyTimes) || hourlyTimes.length === 0) return 0;
  if (!currentTime) return 0;

  // Match the hour prefix, e.g., "2026-11-12T16"
  const currentHourPrefix = currentTime.slice(0, 13);
  const exactIndex = hourlyTimes.findIndex((t) => t.startsWith(currentHourPrefix));
  if (exactIndex !== -1) return exactIndex;

  // Otherwise pick the first hourly slot >= currentTime
  const nextIndex = hourlyTimes.findIndex((t) => t >= currentTime);
  return nextIndex !== -1 ? nextIndex : 0;
}

/**
 * Normalizes Open-Meteo's raw JSON response into a tidy structure for our components.
 */
function normalizeForecast(raw, locationInfo) {
  const current = raw.current || {};
  const hourly = raw.hourly || {};
  const daily = raw.daily || {};

  const startIdx = findCurrentHourIndex(hourly.time, current.time);
  const sliceEnd = startIdx + 24;

  const hourly24 = (hourly.time || []).slice(startIdx, sliceEnd).map((time, offset) => {
    const idx = startIdx + offset;
    return {
      time,
      temp: hourly.temperature_2m?.[idx] ?? 0,
      feelsLike: hourly.apparent_temperature?.[idx] ?? hourly.temperature_2m?.[idx] ?? 0,
      humidity: hourly.relative_humidity_2m?.[idx] ?? 0,
      rainChance: hourly.precipitation_probability?.[idx] ?? 0,
      weatherCode: hourly.weather_code?.[idx] ?? 0,
      cloudCover: hourly.cloud_cover?.[idx] ?? 0,
      wind: hourly.wind_speed_10m?.[idx] ?? 0,
      uv: hourly.uv_index?.[idx] ?? 0,
      isDay: hourly.is_day?.[idx] ?? 1,
    };
  });

  const dailyList = (daily.time || []).map((date, idx) => ({
    date,
    weatherCode: daily.weather_code?.[idx] ?? 0,
    tempMax: daily.temperature_2m_max?.[idx] ?? 0,
    tempMin: daily.temperature_2m_min?.[idx] ?? 0,
    sunrise: daily.sunrise?.[idx] ?? "",
    sunset: daily.sunset?.[idx] ?? "",
    uvMax: daily.uv_index_max?.[idx] ?? 0,
    rainChanceMax: daily.precipitation_probability_max?.[idx] ?? 0,
  }));

  // Open-Meteo provides UV index per hour; grab the current hour's UV safely
  const currentUv = hourly24[0]?.uv ?? dailyList[0]?.uvMax ?? 0;

  // Fallback city name from timezone (e.g., "Asia/Kolkata" -> "Kolkata") when reverse-geocoding is unavailable
  const timezoneCity = raw.timezone
    ? raw.timezone.split("/").pop().replace(/_/g, " ")
    : "Current Location";

  const resolvedLocation = {
    id: locationInfo.id || `${locationInfo.latitude.toFixed(3)},${locationInfo.longitude.toFixed(3)}`,
    name: locationInfo.name || timezoneCity,
    admin1: locationInfo.admin1 || "",
    country: locationInfo.country || "",
    latitude: locationInfo.latitude,
    longitude: locationInfo.longitude,
  };

  return {
    location: resolvedLocation,
    timezone: raw.timezone || "auto",
    current: {
      time: current.time || "",
      temp: current.temperature_2m ?? 0,
      feelsLike: current.apparent_temperature ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      wind: current.wind_speed_10m ?? 0,
      uv: currentUv,
      weatherCode: current.weather_code ?? 0,
      isDay: current.is_day ?? 1,
      cloudCover: current.cloud_cover ?? 0,
    },
    hourly24,
    daily: dailyList,
  };
}

/**
 * Best-effort reverse geocoding for Geolocation coordinates using OpenStreetMap Nominatim.
 * Falls back cleanly to null if the request times out or fails.
 */
async function reverseGeocode(lat, lon) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const name = addr.city || addr.town || addr.village || addr.county || "";
    if (!name) return null;
    return {
      name,
      admin1: addr.state || "",
      country: addr.country || "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Custom hook that manages city geocoding suggestions, weather fetching,
 * geolocation, loading spinners, caching, and error states.
 */
export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  // Cache responses by coordinates so switching between favourites is instant
  const cacheRef = useRef(new Map());
  const forecastAbortRef = useRef(null);

  /**
   * Fetches up to 5 matching cities from Open-Meteo Geocoding API.
   */
  const searchCities = useCallback(async (query, signal) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { results: [], error: null };
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return {
        results: [],
        error: "No internet connection. Cannot search for cities right now.",
      };
    }

    try {
      const url = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;
      const res = await fetch(url, { signal });
      if (!res.ok) {
        throw new Error(`City search failed (HTTP ${res.status}).`);
      }
      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) {
        return {
          results: [],
          error: `No cities found matching "${trimmed}". Try a different spelling.`,
        };
      }
      return { results, error: null };
    } catch (err) {
      if (err.name === "AbortError") {
        return { results: [], error: null, aborted: true };
      }
      return { results: [], error: getFriendlyError(err) };
    }
  }, []);

  /**
   * Fetches weather forecast for a chosen city object ({ name, admin1, country, latitude, longitude }).
   */
  const loadWeatherForCity = useCallback(async (city) => {
    if (!city || typeof city.latitude !== "number" || typeof city.longitude !== "number") {
      setError("Invalid location selected.");
      return;
    }

    const cacheKey = `${city.latitude.toFixed(2)},${city.longitude.toFixed(2)}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      // Keep the user's preferred city label if they clicked a saved favourite
      setWeather({
        ...cached.data,
        location: { ...cached.data.location, ...city },
      });
      setError(null);
      return;
    }

    // Cancel any previous in-flight request so stale data never overwrites newer clicks
    if (forecastAbortRef.current) {
      forecastAbortRef.current.abort();
    }
    const controller = new AbortController();
    forecastAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        latitude: String(city.latitude),
        longitude: String(city.longitude),
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,cloud_cover",
        hourly:
          "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,uv_index,is_day",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "7",
      });

      const res = await fetch(`${FORECAST_URL}?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Weather service error (HTTP ${res.status}). Please try again.`);
      }

      const raw = await res.json();
      const normalized = normalizeForecast(raw, city);

      cacheRef.current.set(cacheKey, {
        savedAt: Date.now(),
        data: normalized,
      });

      setWeather(normalized);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(getFriendlyError(err));
    } finally {
      if (forecastAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Uses the browser Geolocation API to detect the user's coordinates and load weather.
   */
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please search for a city instead.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const place = await reverseGeocode(latitude, longitude);
        setLocating(false);

        await loadWeatherForCity({
          id: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
          name: place?.name || "",
          admin1: place?.admin1 || "",
          country: place?.country || "",
          latitude,
          longitude,
        });
      },
      (geoErr) => {
        setLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError("Location permission was denied. Allow location access or search for a city.");
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setError("Location request timed out. Please try again or search for a city.");
        } else {
          setError("Could not determine your current location. Please search for a city.");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [loadWeatherForCity]);

  return {
    weather,
    loading: loading || locating,
    locating,
    error,
    clearError: () => setError(null),
    searchCities,
    loadWeatherForCity,
    useMyLocation,
  };
}
