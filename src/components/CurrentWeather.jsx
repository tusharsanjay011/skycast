import { getWeatherInfo } from "../utils/weatherCodes.js";
import { formatTemp, formatWind, getUvLabel } from "../utils/formatters.js";

/**
 * Displays the current weather card for the selected city, including
 * temperature, feels-like, condition icon/text, humidity, wind, UV index,
 * and a star button to save/remove the city from favourites.
 */
export default function CurrentWeather({
  weather,
  unit,
  isFavourite,
  onToggleFavourite,
}) {
  const { location, current, daily } = weather;
  const info = getWeatherInfo(current.weatherCode, current.isDay === 1);
  const regionText = [location.admin1, location.country].filter(Boolean).join(", ");
  const today = daily?.[0];

  return (
    <section className="glass-card current-card" aria-label="Current weather">
      <div className="current-header">
        <div>
          <h2 className="city-title">{location.name}</h2>
          {regionText && <p className="city-subtitle">{regionText}</p>}
        </div>

        <button
          type="button"
          className={`star-btn ${isFavourite ? "is-saved" : ""}`}
          onClick={() => onToggleFavourite(location)}
          aria-pressed={isFavourite}
          aria-label={
            isFavourite
              ? `Remove ${location.name} from favourites`
              : `Save ${location.name} to favourites`
          }
          title={isFavourite ? "Remove from favourites" : "Save to favourites"}
        >
          <span aria-hidden="true">{isFavourite ? "★" : "☆"}</span>
          <span>{isFavourite ? "Saved" : "Save"}</span>
        </button>
      </div>

      <div className="current-main">
        <div className="current-temp-group">
          <span className="current-emoji" role="img" aria-label={info.label}>
            {info.icon}
          </span>
          <div>
            <div className="current-temp">{formatTemp(current.temp, unit)}</div>
            <p className="current-condition">{info.label}</p>
          </div>
        </div>

        <div className="current-feels">
          <span>Feels like {formatTemp(current.feelsLike, unit)}</span>
          {today && (
            <span>
              H: {formatTemp(today.tempMax, unit, false)} · L:{" "}
              {formatTemp(today.tempMin, unit, false)}
            </span>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Humidity</span>
          <span className="metric-value">{Math.round(current.humidity)}%</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">Wind</span>
          <span className="metric-value">{formatWind(current.wind, unit)}</span>
        </div>
        <div className="metric-box">
          <span className="metric-label">UV Index</span>
          <span className="metric-value">
            {Math.round(current.uv)} ({getUvLabel(current.uv)})
          </span>
        </div>
      </div>
    </section>
  );
}

