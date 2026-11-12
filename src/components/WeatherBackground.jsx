import { useMemo } from "react";

/**
 * Pure-CSS animated backdrop that changes with the weather condition
 * (sunny, cloudy, rain, snow, thunderstorm, fog) and day/night.
 */
export default function WeatherBackground({ theme = "sunny", isDay = true }) {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        left: `${(i * 39) % 100}%`,
        delay: `${(i % 8) * 0.7}s`,
        duration: `${6 + (i % 4)}s`,
        size: 4 + (i % 3) * 2,
      })),
    []
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        top: `${(i * 47) % 85}%`,
        left: `${(i * 31) % 100}%`,
        delay: `${(i % 10) * 0.45}s`,
      })),
    []
  );

  const sceneClass = `weather-bg bg-${theme}-${isDay ? "day" : "night"}`;

  return (
    <div className={sceneClass} aria-hidden="true">
      {!isDay && (
        <div className="bg-stars">
          {stars.map((star, idx) => (
            <span
              key={idx}
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
            />
          ))}
        </div>
      )}

      {theme === "sunny" && isDay && <div className="bg-sun-glow" />}
      {theme === "sunny" && !isDay && <div className="bg-moon-glow" />}

      {(theme === "cloudy" || theme === "rain" || theme === "thunderstorm") && (
        <>
          <div className="bg-cloud cloud-1" />
          <div className="bg-cloud cloud-2" />
        </>
      )}

      {(theme === "rain" || theme === "thunderstorm") && (
        <div className="bg-rain-layer" />
      )}

      {theme === "thunderstorm" && <div className="bg-lightning" />}

      {theme === "snow" && (
        <div className="bg-snow-layer">
          {snowflakes.map((flake, idx) => (
            <span
              key={idx}
              style={{
                left: flake.left,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
              }}
            />
          ))}
        </div>
      )}

      {theme === "fog" && <div className="bg-fog-layer" />}
    </div>
  );
}
