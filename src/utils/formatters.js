/**
 * Formatting helpers for temperatures, wind speeds, dates, and hours.
 * All raw data from Open-Meteo is stored in metric (°C and km/h) so switching
 * units only changes display formatting and never triggers an extra API call.
 */

export function celsiusToFahrenheit(tempC) {
  return (tempC * 9) / 5 + 32;
}

export function kmhToMph(speedKmh) {
  return speedKmh * 0.621371;
}

/**
 * Formats a temperature in °C to the chosen unit ("C" or "F").
 * Pass showUnit = false for compact labels like "22°".
 */
export function formatTemp(tempC, unit = "C", showUnit = true) {
  if (tempC === null || tempC === undefined || Number.isNaN(tempC)) {
    return "--";
  }
  const value = unit === "F" ? celsiusToFahrenheit(tempC) : tempC;
  const rounded = Math.round(value);
  return showUnit ? `${rounded}°${unit}` : `${rounded}°`;
}

/**
 * Formats wind speed in km/h to km/h (when unit === "C") or mph (when unit === "F").
 */
export function formatWind(speedKmh, unit = "C") {
  if (speedKmh === null || speedKmh === undefined || Number.isNaN(speedKmh)) {
    return "--";
  }
  if (unit === "F") {
    return `${Math.round(kmhToMph(speedKmh))} mph`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

/**
 * Formats an Open-Meteo ISO timestamp like "2026-11-12T15:00" into "3 PM"
 * (or "3:00 PM" when includeMinutes = true).
 * Parsing directly from the string keeps the city's local time intact without
 * browser-timezone offset bugs.
 */
export function formatHourLabel(isoString, includeMinutes = false) {
  if (!isoString || isoString.length < 16) return "";
  const hour24 = Number(isoString.slice(11, 13));
  const minute = isoString.slice(14, 16);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return includeMinutes ? `${hour12}:${minute} ${period}` : `${hour12} ${period}`;
}

/**
 * Formats an hour index offset by +1 hour (used to show end of a time range,
 * e.g., "6:00 AM - 8:00 AM").
 */
export function formatNextHourLabel(isoString) {
  if (!isoString || isoString.length < 16) return "";
  const hour24 = (Number(isoString.slice(11, 13)) + 1) % 24;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${period}`;
}

/**
 * Formats a YYYY-MM-DD date string into "Today", "Tomorrow", or short weekday ("Mon").
 */
export function formatDayName(dateString, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-US", { weekday: "short" });
}

/**
 * Formats a YYYY-MM-DD date string into a short readable date like "Nov 12".
 */
export function formatShortDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Returns a simple UV index severity label for quick reading.
 */
export function getUvLabel(uv) {
  if (uv === null || uv === undefined || Number.isNaN(uv)) return "";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

