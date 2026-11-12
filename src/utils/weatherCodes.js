/**
 * Converts Open-Meteo WMO weather interpretation codes into
 * human-readable descriptions, emojis, and background theme keys.
 * Reference: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */

const WEATHER_CODE_MAP = {
  0: { label: "Clear sky", dayIcon: "☀️", nightIcon: "🌙", theme: "sunny" },
  1: { label: "Mainly clear", dayIcon: "🌤️", nightIcon: "🌙", theme: "sunny" },
  2: { label: "Partly cloudy", dayIcon: "⛅", nightIcon: "☁️", theme: "cloudy" },
  3: { label: "Overcast", dayIcon: "☁️", nightIcon: "☁️", theme: "cloudy" },

  45: { label: "Foggy", dayIcon: "🌫️", nightIcon: "🌫️", theme: "fog" },
  48: { label: "Depositing rime fog", dayIcon: "🌫️", nightIcon: "🌫️", theme: "fog" },

  51: { label: "Light drizzle", dayIcon: "🌦️", nightIcon: "🌧️", theme: "rain" },
  53: { label: "Moderate drizzle", dayIcon: "🌦️", nightIcon: "🌧️", theme: "rain" },
  55: { label: "Dense drizzle", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  56: { label: "Light freezing drizzle", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  57: { label: "Dense freezing drizzle", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },

  61: { label: "Light rain", dayIcon: "🌦️", nightIcon: "🌧️", theme: "rain" },
  63: { label: "Moderate rain", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  65: { label: "Heavy rain", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  66: { label: "Light freezing rain", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  67: { label: "Heavy freezing rain", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },

  71: { label: "Light snow", dayIcon: "🌨️", nightIcon: "🌨️", theme: "snow" },
  73: { label: "Moderate snow", dayIcon: "❄️", nightIcon: "❄️", theme: "snow" },
  75: { label: "Heavy snow", dayIcon: "❄️", nightIcon: "❄️", theme: "snow" },
  77: { label: "Snow grains", dayIcon: "🌨️", nightIcon: "🌨️", theme: "snow" },

  80: { label: "Light rain showers", dayIcon: "🌦️", nightIcon: "🌧️", theme: "rain" },
  81: { label: "Moderate rain showers", dayIcon: "🌧️", nightIcon: "🌧️", theme: "rain" },
  82: { label: "Violent rain showers", dayIcon: "⛈️", nightIcon: "⛈️", theme: "rain" },

  85: { label: "Light snow showers", dayIcon: "🌨️", nightIcon: "🌨️", theme: "snow" },
  86: { label: "Heavy snow showers", dayIcon: "❄️", nightIcon: "❄️", theme: "snow" },

  95: { label: "Thunderstorm", dayIcon: "⛈️", nightIcon: "⛈️", theme: "thunderstorm" },
  96: { label: "Thunderstorm with light hail", dayIcon: "⛈️", nightIcon: "⛈️", theme: "thunderstorm" },
  99: { label: "Thunderstorm with heavy hail", dayIcon: "⛈️", nightIcon: "⛈️", theme: "thunderstorm" },
};

/**
 * Returns { label, icon, theme } for a given Open-Meteo weather code.
 * @param {number} code - WMO weather code from Open-Meteo
 * @param {boolean} isDay - true for daytime, false for nighttime
 */
export function getWeatherInfo(code, isDay = true) {
  const entry = WEATHER_CODE_MAP[code];
  if (!entry) {
    return {
      label: "Unknown",
      icon: isDay ? "🌡️" : "🌙",
      theme: "cloudy",
    };
  }

  return {
    label: entry.label,
    icon: isDay ? entry.dayIcon : entry.nightIcon,
    theme: entry.theme,
  };
}

/**
 * Returns a background CSS modifier class combining the weather theme and day/night.
 * Examples: "bg-sunny-day", "bg-sunny-night", "bg-rain-day", "bg-thunderstorm-night".
 */
export function getBackgroundScene(code, isDay = true) {
  const { theme } = getWeatherInfo(code, isDay);
  const timeOfDay = isDay ? "day" : "night";
  return {
    theme,
    isDay,
    className: `bg-${theme}-${timeOfDay}`,
  };
}

