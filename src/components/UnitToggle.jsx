/**
 * Accessible toggle between Celsius (°C, km/h) and Fahrenheit (°F, mph).
 */
export default function UnitToggle({ unit, onChangeUnit }) {
  return (
    <div className="unit-toggle" role="group" aria-label="Temperature and wind unit">
      <button
        type="button"
        className={`unit-btn ${unit === "C" ? "is-active" : ""}`}
        aria-pressed={unit === "C"}
        onClick={() => onChangeUnit("C")}
      >
        °C · km/h
      </button>
      <button
        type="button"
        className={`unit-btn ${unit === "F" ? "is-active" : ""}`}
        aria-pressed={unit === "F"}
        onClick={() => onChangeUnit("F")}
      >
        °F · mph
      </button>
    </div>
  );
}
