import { getWeatherInfo } from "../utils/weatherCodes.js";
import { formatTemp, formatDayName, formatShortDate } from "../utils/formatters.js";

/**
 * 7-day forecast grid showing one card per day with day name,
 * condition icon, description, and high/low temperatures.
 */
export default function DailyForecast({ daily, unit }) {
  if (!daily || daily.length === 0) return null;

  return (
    <section className="glass-card section-card" aria-label="7-day forecast">
      <div className="section-header">
        <h3 className="section-title">7-Day Forecast</h3>
      </div>

      <div className="daily-grid">
        {daily.map((day, index) => {
          const info = getWeatherInfo(day.weatherCode, true);
          return (
            <article key={day.date} className="daily-card">
              <div className="daily-day">
                <span className="daily-name">{formatDayName(day.date, index)}</span>
                <span className="daily-date">{formatShortDate(day.date)}</span>
              </div>

              <div className="daily-condition">
                <span className="daily-icon" role="img" aria-label={info.label}>
                  {info.icon}
                </span>
                <span className="daily-label">{info.label}</span>
              </div>

              <div className="daily-temps">
                <span className="temp-high" title="High temperature">
                  {formatTemp(day.tempMax, unit, false)}
                </span>
                <span className="temp-divider">/</span>
                <span className="temp-low" title="Low temperature">
                  {formatTemp(day.tempMin, unit, false)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

