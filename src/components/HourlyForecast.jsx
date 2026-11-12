import { getWeatherInfo } from "../utils/weatherCodes.js";
import { formatTemp, formatHourLabel } from "../utils/formatters.js";

/**
 * Horizontally scrollable 24-hour forecast strip starting from the current hour.
 */
export default function HourlyForecast({ hourly24, unit }) {
  if (!hourly24 || hourly24.length === 0) return null;

  return (
    <section className="glass-card section-card" aria-label="Hourly forecast">
      <div className="section-header">
        <h3 className="section-title">Next 24 Hours</h3>
        <span className="section-hint">Scroll sideways →</span>
      </div>

      <div
        className="hourly-strip"
        tabIndex={0}
        role="region"
        aria-label="24-hour scrollable forecast"
      >
        {hourly24.map((hour, index) => {
          const info = getWeatherInfo(hour.weatherCode, hour.isDay === 1);
          const timeLabel = index === 0 ? "Now" : formatHourLabel(hour.time);

          return (
            <div key={hour.time} className={`hourly-item ${index === 0 ? "is-now" : ""}`}>
              <span className="hourly-time">{timeLabel}</span>
              <span className="hourly-icon" role="img" aria-label={info.label}>
                {info.icon}
              </span>
              <span className="hourly-temp">{formatTemp(hour.temp, unit, false)}</span>
              <span className="hourly-rain" title="Precipitation probability">
                💧 {Math.round(hour.rainChance)}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

