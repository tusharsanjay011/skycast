import { useState, useMemo } from "react";
import { ACTIVITIES, evaluateDayForActivity } from "../utils/activityScore.js";
import { formatHourLabel, formatTemp, formatWind } from "../utils/formatters.js";

/**
 * "Plan My Day" — Best Time to Go Out activity planner.
 * Lets the user pick an activity (saved in localStorage), scores each of the
 * next 24 hours from 0-100, displays a colour-coded scrollable bar, and
 * highlights the best time window (or warns if it's not a good day).
 */
export default function PlanMyDay({
  hourly24,
  daily,
  unit,
  selectedActivity,
  onChangeActivity,
}) {
  const [focusedIndex, setFocusedIndex] = useState(null);

  const evaluation = useMemo(
    () => evaluateDayForActivity(selectedActivity, hourly24 || [], daily || []),
    [selectedActivity, hourly24, daily]
  );

  const activeActivity =
    ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[0];

  const inspectedHour =
    focusedIndex !== null ? evaluation.scoredHours[focusedIndex] : null;

  return (
    <section className="glass-card section-card plan-card" aria-label="Plan My Day">
      <div className="section-header">
        <div>
          <h3 className="section-title">Plan My Day</h3>
          <p className="section-subtitle">
            Find the best time window for your outdoor plans
          </p>
        </div>
        <div className="score-legend" aria-label="Score color key">
          <span className="legend-dot great">75–100 Great</span>
          <span className="legend-dot okay">50–74 Okay</span>
          <span className="legend-dot avoid">&lt;50 Avoid</span>
        </div>
      </div>

      {/* Activity picker */}
      <div className="activity-picker" role="group" aria-label="Choose an activity">
        {ACTIVITIES.map((activity) => {
          const isSelected = activity.id === selectedActivity;
          return (
            <button
              key={activity.id}
              type="button"
              className={`activity-btn ${isSelected ? "is-selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => {
                onChangeActivity(activity.id);
                setFocusedIndex(null);
              }}
            >
              <span aria-hidden="true">{activity.icon}</span>
              <span>{activity.label}</span>
            </button>
          );
        })}
      </div>

      {/* Highlighted recommendation card */}
      <div
        className={`best-time-banner ${
          evaluation.isGoodDay ? "is-good" : "is-bad"
        }`}
        role="status"
      >
        <div className="best-time-icon" aria-hidden="true">
          {evaluation.isGoodDay ? "✅" : "⚠️"}
        </div>
        <div className="best-time-text">
          <strong className="best-time-headline">{evaluation.headline}</strong>
          <p className="best-time-reason">
            {evaluation.isGoodDay
              ? evaluation.reason
              : `Main reason: ${evaluation.reason}`}
          </p>
        </div>
      </div>

      {/* Horizontally scrollable colour-coded 24-hour bar */}
      <div
        className="score-bar-scroll"
        tabIndex={0}
        role="region"
        aria-label="Hourly activity comfort scores"
      >
        {evaluation.scoredHours.map((hour, index) => {
          const isBestWindow =
            evaluation.isGoodDay &&
            index >= evaluation.startIndex &&
            index <= evaluation.endIndex;
          const isFocused = focusedIndex === index;
          const timeLabel = index === 0 ? "Now" : formatHourLabel(hour.time);

          return (
            <button
              key={hour.time}
              type="button"
              className={`score-col level-${hour.level} ${
                isBestWindow ? "is-best-window" : ""
              } ${isFocused ? "is-focused" : ""}`}
              onClick={() =>
                setFocusedIndex((prev) => (prev === index ? null : index))
              }
              aria-label={`${timeLabel}: score ${hour.score} out of 100 (${hour.level})`}
              title={`${timeLabel} — Score ${hour.score}/100`}
            >
              <span className="score-number">{hour.score}</span>
              <div className="score-meter-track" aria-hidden="true">
                <div
                  className="score-meter-fill"
                  style={{ height: `${Math.max(12, hour.score)}%` }}
                />
              </div>
              <span className="score-hour">{timeLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Optional detail line when the user clicks an hour bar */}
      {inspectedHour && (
        <div className="inspected-hour-note">
          <strong>{formatHourLabel(inspectedHour.time, true)}</strong> · Score{" "}
          <strong>{inspectedHour.score}/100</strong> ·{" "}
          {formatTemp(inspectedHour.temp, unit)} · 💧 {Math.round(inspectedHour.rainChance)}%
          rain · Wind {formatWind(inspectedHour.wind, unit)} · UV{" "}
          {Math.round(inspectedHour.uv)}
          {inspectedHour.badReasons.length > 0 && (
            <span> · Note: {inspectedHour.badReasons.join(", ")}</span>
          )}
        </div>
      )}

      {/* Expandable explanation note */}
      <details className="how-scores-details">
        <summary>How scores are calculated</summary>
        <div className="how-scores-body">
          <p>
            <strong>{activeActivity.label}:</strong> {activeActivity.summary}
          </p>
          <ul>
            <li>
              <strong>Running / Cycling / Walking / Sports:</strong> Start at 100 and
              subtract points if temperature moves outside the comfort zone (around
              15–28°C), rain chance rises above 20%, wind exceeds ~20 km/h, UV climbs
              above 6, or humidity passes 75%. Outdoor sports also penalize dark
              hours.
            </li>
            <li>
              <strong>Drying Clothes:</strong> Rewards warm air, low humidity (under
              55%), a steady breeze (8–28 km/h), daytime sun, and zero rain.
            </li>
            <li>
              <strong>Photography (golden hour):</strong> Rewards hours within 1–2
              hours of sunrise or sunset with light cloud cover (10–45%) and dry air.
            </li>
          </ul>
        </div>
      </details>
    </section>
  );
}

