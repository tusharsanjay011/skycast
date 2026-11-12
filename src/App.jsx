import { useMemo } from "react";
import SearchBar from "./components/SearchBar.jsx";
import UnitToggle from "./components/UnitToggle.jsx";
import Favourites from "./components/Favourites.jsx";
import CurrentWeather from "./components/CurrentWeather.jsx";
import HourlyForecast from "./components/HourlyForecast.jsx";
import PlanMyDay from "./components/PlanMyDay.jsx";
import DailyForecast from "./components/DailyForecast.jsx";
import WeatherBackground from "./components/WeatherBackground.jsx";
import { useWeather } from "./hooks/useWeather.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { getBackgroundScene } from "./utils/weatherCodes.js";

const SAMPLE_CITIES = [
  { id: "sample-london", name: "London", admin1: "England", country: "United Kingdom", latitude: 51.5085, longitude: -0.1257 },
  { id: "sample-tokyo", name: "Tokyo", admin1: "Tokyo", country: "Japan", latitude: 35.6895, longitude: 139.6917 },
  { id: "sample-mumbai", name: "Mumbai", admin1: "Maharashtra", country: "India", latitude: 19.0728, longitude: 72.8826 },
];

export default function App() {
  const {
    weather,
    loading,
    locating,
    error,
    clearError,
    searchCities,
    loadWeatherForCity,
    useMyLocation,
  } = useWeather();

  // Persist user preferences in localStorage
  const [unit, setUnit] = useLocalStorage("skycast_unit", "C");
  const [favourites, setFavourites] = useLocalStorage("skycast_favourites", []);
  const [selectedActivity, setSelectedActivity] = useLocalStorage(
    "skycast_activity",
    "running"
  );

  // Determine the animated background scene from current weather + day/night
  const scene = useMemo(() => {
    if (!weather) {
      return { theme: "sunny", isDay: true };
    }
    return getBackgroundScene(
      weather.current.weatherCode,
      weather.current.isDay === 1
    );
  }, [weather]);

  const isCurrentFavourite = Boolean(
    weather && favourites.some((item) => item.id === weather.location.id)
  );

  function handleToggleFavourite(location) {
    setFavourites((prev) => {
      const exists = prev.some((item) => item.id === location.id);
      if (exists) {
        return prev.filter((item) => item.id !== location.id);
      }
      return [...prev, location];
    });
  }

  function handleRemoveFavourite(cityId) {
    setFavourites((prev) => prev.filter((item) => item.id !== cityId));
  }

  return (
    <div className="app-wrapper">
      <WeatherBackground theme={scene.theme} isDay={scene.isDay} />

      <div className="app-container">
        <header className="app-header">
          <div className="brand">
            <span className="brand-logo" aria-hidden="true">
              ⛅
            </span>
            <div>
              <h1 className="brand-title">SkyCast</h1>
              <p className="brand-tagline">Weather &amp; Best Time to Go Out</p>
            </div>
          </div>

          <UnitToggle unit={unit} onChangeUnit={setUnit} />
        </header>

        <main className="main-content">
          <SearchBar
            searchCities={searchCities}
            onSelectCity={loadWeatherForCity}
            onUseMyLocation={useMyLocation}
            locating={locating}
          />

          <Favourites
            favourites={favourites}
            activeCityId={weather?.location.id}
            onSelectCity={loadWeatherForCity}
            onRemoveCity={handleRemoveFavourite}
          />

          {error && (
            <div className="glass-card error-banner" role="alert">
              <div>
                <strong>Heads up:</strong> {error}
              </div>
              <button
                type="button"
                className="dismiss-error-btn"
                onClick={clearError}
                aria-label="Dismiss error message"
              >
                ×
              </button>
            </div>
          )}

          {loading && (
            <div className="glass-card loading-card" role="status" aria-live="polite">
              <div className="loader-spinner" aria-hidden="true" />
              <p>Fetching live forecast...</p>
            </div>
          )}

          {!loading && !weather && !error && (
            <section className="glass-card empty-state" aria-label="Welcome">
              <div className="empty-icon" aria-hidden="true">
                🌤️
              </div>
              <h2>Check the sky before you step out</h2>
              <p>
                Search for any city above, click <strong>Use my location</strong>, or
                pick a quick city below to see live conditions and your{" "}
                <strong>Plan My Day</strong> comfort score.
              </p>
              <div className="quick-cities">
                {SAMPLE_CITIES.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    className="quick-city-btn"
                    onClick={() => loadWeatherForCity(city)}
                  >
                    {city.name}, {city.country}
                  </button>
                ))}
              </div>
            </section>
          )}

          {!loading && weather && (
            <div className="weather-stack">
              <CurrentWeather
                weather={weather}
                unit={unit}
                isFavourite={isCurrentFavourite}
                onToggleFavourite={handleToggleFavourite}
              />

              <HourlyForecast hourly24={weather.hourly24} unit={unit} />

              <PlanMyDay
                hourly24={weather.hourly24}
                daily={weather.daily}
                unit={unit}
                selectedActivity={selectedActivity}
                onChangeActivity={setSelectedActivity}
              />

              <DailyForecast daily={weather.daily} unit={unit} />
            </div>
          )}
        </main>

        <footer className="app-footer">
          <p>
            Powered by{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo
            </a>{" "}
            · Free, open-source weather data
          </p>
        </footer>
      </div>
    </div>
  );
}
