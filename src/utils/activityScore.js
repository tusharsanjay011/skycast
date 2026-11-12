import { formatHourLabel, formatNextHourLabel } from "./formatters.js";

/**
 * Activity definitions shown in the "Plan My Day" activity picker.
 */
export const ACTIVITIES = [
  {
    id: "running",
    label: "Running",
    icon: "🏃",
    summary: "Cool-to-mild air, low rain risk, calm wind, and moderate UV.",
  },
  {
    id: "cycling",
    label: "Cycling",
    icon: "🚴",
    summary: "Mild temperatures, low headwinds, dry roads, and safe UV.",
  },
  {
    id: "walking",
    label: "Walking",
    icon: "🚶",
    summary: "Comfortable temperatures, low rain chance, and gentle breeze.",
  },
  {
    id: "sports",
    label: "Cricket/Outdoor Sports",
    icon: "🏏",
    summary: "Daylight hours, mild heat, dry ground, calm wind, and tolerable UV.",
  },
  {
    id: "drying",
    label: "Drying Clothes",
    icon: "👕",
    summary: "Warm air, low humidity, helpful breeze, sunny skies, and no rain.",
  },
  {
    id: "photography",
    label: "Photography (golden hour)",
    icon: "📷",
    summary: "Hours close to sunrise or sunset with light cloud cover and dry air.",
  },
];

/**
 * Scoring thresholds and penalty weights for every activity.
 * Keeping all numbers in one config object makes it easy to tweak later!
 */
export const ACTIVITY_RULES = {
  running: {
    type: "outdoor_sport",
    idealTempMin: 12,
    idealTempMax: 24,
    tempPenaltyPerDeg: 4,
    maxRainChance: 20,
    rainPenaltyPerPct: 1.1,
    maxWind: 20,
    windPenaltyPerKmh: 1.8,
    maxUv: 6,
    uvPenaltyPerUnit: 5,
    maxHumidity: 75,
    humidityPenaltyPerPct: 0.7,
    needsDaylight: false,
    nightPenalty: 8,
  },
  cycling: {
    type: "outdoor_sport",
    idealTempMin: 15,
    idealTempMax: 28,
    tempPenaltyPerDeg: 3.5,
    maxRainChance: 20,
    rainPenaltyPerPct: 1.2,
    maxWind: 18, // Wind affects cyclists more than runners
    windPenaltyPerKmh: 2.3,
    maxUv: 6,
    uvPenaltyPerUnit: 5,
    maxHumidity: 75,
    humidityPenaltyPerPct: 0.6,
    needsDaylight: false,
    nightPenalty: 15, // Reduced visibility on roads after dark
  },
  walking: {
    type: "outdoor_sport",
    idealTempMin: 14,
    idealTempMax: 28,
    tempPenaltyPerDeg: 3,
    maxRainChance: 20,
    rainPenaltyPerPct: 1.1,
    maxWind: 22,
    windPenaltyPerKmh: 1.5,
    maxUv: 6,
    uvPenaltyPerUnit: 4.5,
    maxHumidity: 78,
    humidityPenaltyPerPct: 0.5,
    needsDaylight: false,
    nightPenalty: 8,
  },
  sports: {
    type: "outdoor_sport",
    idealTempMin: 15,
    idealTempMax: 28,
    tempPenaltyPerDeg: 3.5,
    maxRainChance: 20,
    rainPenaltyPerPct: 1.3,
    maxWind: 20, // Strong wind affects ball flight in cricket/outdoor games
    windPenaltyPerKmh: 2,
    maxUv: 6,
    uvPenaltyPerUnit: 5.5,
    maxHumidity: 75,
    humidityPenaltyPerPct: 0.7,
    needsDaylight: true, // Can't play outdoor cricket in the dark
    nightPenalty: 60,
  },
  drying: {
    type: "drying",
    idealTempMin: 22, // Warm air speeds up evaporation
    tempPenaltyPerDeg: 2.2,
    idealHumidityMax: 55,
    humidityPenaltyPerPct: 1.1,
    idealWindMin: 8,
    idealWindMax: 28,
    calmWindPenalty: 10,
    strongWindPenaltyPerKmh: 1.5,
    maxRainChance: 15,
    rainPenaltyPerPct: 1.3,
    maxCloudCover: 65,
    cloudPenaltyPerPct: 0.35,
    nightPenalty: 20,
  },
  photography: {
    type: "photography",
    goldenWindowMins: 60, // Within 1 hour of sunrise/sunset = best light
    shoulderWindowMins: 120, // Within 2 hours = decent soft light
    shoulderPenalty: 18,
    middayOrNightPenalty: 58,
    idealCloudMin: 10, // Light clouds catch warm sunset/sunrise colours
    idealCloudMax: 45,
    clearSkyPenalty: 6,
    overcastPenaltyPerPct: 0.7,
    maxRainChance: 20,
    rainPenaltyPerPct: 1.2,
    maxWind: 24,
    windPenaltyPerKmh: 1.2,
  },
};

// WMO codes where active rain, snow, or thunder makes outdoor plans unpleasant
const WET_OR_STORMY_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
]);

/**
 * Converts an ISO string like "2026-11-12T16:30" into minutes since 2020-01-01
 * using calendar fields only (avoids local browser timezone shifts).
 */
function toMinuteStamp(isoString) {
  if (!isoString || isoString.length < 16) return 0;
  const year = Number(isoString.slice(0, 4));
  const month = Number(isoString.slice(5, 7));
  const day = Number(isoString.slice(8, 10));
  const hour = Number(isoString.slice(11, 13));
  const minute = Number(isoString.slice(14, 16));
  return Math.floor(Date.UTC(year, month - 1, day, hour, minute) / 60000);
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getScoreLevel(score) {
  if (score >= 75) return "great";
  if (score >= 50) return "okay";
  return "avoid";
}

/**
 * Scores a single hour (0-100) for the chosen activity and returns helpful
 * positive reasons and limiting factors for UI explanations.
 */
export function scoreActivityHour(activityId, hour, sunEvents = []) {
  const rule = ACTIVITY_RULES[activityId] || ACTIVITY_RULES.running;
  let score = 100;
  const goodReasons = [];
  const badReasons = [];

  const isWetCode = WET_OR_STORMY_CODES.has(hour.weatherCode);

  if (rule.type === "outdoor_sport") {
    // 1. Temperature check
    if (hour.temp < rule.idealTempMin) {
      score -= (rule.idealTempMin - hour.temp) * rule.tempPenaltyPerDeg;
      badReasons.push(hour.temp < 5 ? "freezing cold" : "too chilly");
    } else if (hour.temp > rule.idealTempMax) {
      score -= (hour.temp - rule.idealTempMax) * rule.tempPenaltyPerDeg;
      badReasons.push(hour.temp > 34 ? "extreme heat" : "too warm");
    } else {
      goodReasons.push(hour.temp <= 21 ? "cool" : "comfortable temp");
    }

    // 2. Rain probability + weather code
    if (hour.rainChance > rule.maxRainChance) {
      score -= (hour.rainChance - rule.maxRainChance) * rule.rainPenaltyPerPct;
      badReasons.push("high rain chance");
    } else {
      goodReasons.push("no rain");
    }
    if (isWetCode) {
      score -= 22;
      if (!badReasons.includes("high rain chance")) badReasons.push("wet weather");
    }

    // 3. Wind speed
    if (hour.wind > rule.maxWind) {
      score -= (hour.wind - rule.maxWind) * rule.windPenaltyPerKmh;
      badReasons.push("strong wind");
    }

    // 4. UV index
    if (hour.uv > rule.maxUv) {
      score -= (hour.uv - rule.maxUv) * rule.uvPenaltyPerUnit;
      badReasons.push("high UV");
    } else if (hour.isDay === 1) {
      goodReasons.push("low UV");
    }

    // 5. Humidity
    if (hour.humidity > rule.maxHumidity) {
      score -= (hour.humidity - rule.maxHumidity) * rule.humidityPenaltyPerPct;
      badReasons.push("high humidity");
    }

    // 6. Daylight
    if (hour.isDay === 0) {
      score -= rule.nightPenalty;
      if (rule.needsDaylight) {
        badReasons.push("dark outside");
      }
    }
  } else if (rule.type === "drying") {
    // 1. Rain check (deal-breaker for laundry)
    if (hour.rainChance > rule.maxRainChance) {
      score -= (hour.rainChance - rule.maxRainChance) * rule.rainPenaltyPerPct;
      badReasons.push("rain risk");
    } else {
      goodReasons.push("dry weather");
    }
    if (isWetCode) {
      score -= 35;
      if (!badReasons.includes("rain risk")) badReasons.push("rainy conditions");
    }

    // 2. Humidity
    if (hour.humidity > rule.idealHumidityMax) {
      score -= (hour.humidity - rule.idealHumidityMax) * rule.humidityPenaltyPerPct;
      badReasons.push("high humidity");
    } else {
      goodReasons.push("low humidity");
    }

    // 3. Temperature
    if (hour.temp < rule.idealTempMin) {
      score -= (rule.idealTempMin - hour.temp) * rule.tempPenaltyPerDeg;
      if (hour.temp < 12) badReasons.push("cold air");
    } else {
      goodReasons.push("warm air");
    }

    // 4. Wind (breeze helps, dead calm or gale hurts)
    if (hour.wind < rule.idealWindMin) {
      score -= rule.calmWindPenalty;
    } else if (hour.wind > rule.idealWindMax) {
      score -= (hour.wind - rule.idealWindMax) * rule.strongWindPenaltyPerKmh;
      badReasons.push("gusty wind");
    } else {
      goodReasons.push("good breeze");
    }

    // 5. Sunshine / cloud cover and night
    if (hour.cloudCover > rule.maxCloudCover) {
      score -= (hour.cloudCover - rule.maxCloudCover) * rule.cloudPenaltyPerPct;
    }
    if (hour.isDay === 0) {
      score -= rule.nightPenalty;
      badReasons.push("no sunlight at night");
    }
  } else if (rule.type === "photography") {
    // 1. Proximity to nearest sunrise or sunset
    const hourStamp = toMinuteStamp(hour.time);
    let minDiff = Infinity;
    let nearestType = "golden hour";

    for (const ev of sunEvents) {
      const diff = Math.abs(hourStamp - ev.stamp);
      if (diff < minDiff) {
        minDiff = diff;
        nearestType = ev.type;
      }
    }

    if (minDiff <= rule.goldenWindowMins) {
      goodReasons.push(`near ${nearestType}`);
    } else if (minDiff <= rule.shoulderWindowMins) {
      score -= rule.shoulderPenalty;
      goodReasons.push(`close to ${nearestType}`);
    } else {
      score -= rule.middayOrNightPenalty;
      badReasons.push(hour.isDay === 1 ? "harsh midday light" : "too dark");
    }

    // 2. Cloud cover (some clouds look great; heavy overcast blocks sun)
    if (hour.cloudCover < rule.idealCloudMin) {
      score -= rule.clearSkyPenalty;
      goodReasons.push("clear sky");
    } else if (hour.cloudCover <= rule.idealCloudMax) {
      goodReasons.push("soft cloud cover");
    } else {
      score -= (hour.cloudCover - rule.idealCloudMax) * rule.overcastPenaltyPerPct;
      badReasons.push("heavy cloud cover");
    }

    // 3. Rain & wind
    if (hour.rainChance > rule.maxRainChance) {
      score -= (hour.rainChance - rule.maxRainChance) * rule.rainPenaltyPerPct;
      badReasons.push("rain risk");
    } else {
      goodReasons.push("dry air");
    }
    if (isWetCode) {
      score -= 25;
    }
    if (hour.wind > rule.maxWind) {
      score -= (hour.wind - rule.maxWind) * rule.windPenaltyPerKmh;
      badReasons.push("windy");
    }
  }

  const finalScore = clampScore(score);
  return {
    ...hour,
    score: finalScore,
    level: getScoreLevel(finalScore),
    goodReasons,
    badReasons,
  };
}

/**
 * Formats a concise list of reasons, e.g. ["Cool", "low UV", "no rain"] -> "Cool, low UV and no rain".
 */
function joinReasons(list, fallback) {
  const unique = [...new Set(list)].slice(0, 3);
  if (unique.length === 0) return fallback;

  const formatted = unique.map((item, idx) =>
    idx === 0 ? item.charAt(0).toUpperCase() + item.slice(1) : item
  );

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")} and ${formatted[formatted.length - 1]}`;
}

/**
 * Evaluates all 24 hours for an activity and finds the best contiguous window
 * (1 to 3 hours) or explains why it's not a good day.
 */
export function evaluateDayForActivity(activityId, hourly24, dailySun = []) {
  // Build a flat list of sunrise/sunset timestamps so photography checks work across midnight
  const sunEvents = [];
  for (const day of dailySun) {
    if (day.sunrise) sunEvents.push({ type: "sunrise", stamp: toMinuteStamp(day.sunrise) });
    if (day.sunset) sunEvents.push({ type: "sunset", stamp: toMinuteStamp(day.sunset) });
  }

  const scoredHours = hourly24.map((hour) => scoreActivityHour(activityId, hour, sunEvents));

  // Find the highest-scoring single hour
  let peakIndex = 0;
  for (let i = 1; i < scoredHours.length; i++) {
    if (scoredHours[i].score > scoredHours[peakIndex].score) {
      peakIndex = i;
    }
  }

  const peakHour = scoredHours[peakIndex];

  // Requirement: if no hour scores above 50, report "Not a good day for this activity"
  if (!peakHour || peakHour.score <= 50) {
    // Count the most frequent limiting factor across the 24 hours
    const counts = {};
    for (const h of scoredHours) {
      for (const reason of h.badReasons) {
        counts[reason] = (counts[reason] || 0) + 1;
      }
    }
    const topIssues = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return {
      scoredHours,
      isGoodDay: false,
      headline: "Not a good day for this activity",
      reason: joinReasons(topIssues, "Unfavourable weather conditions throughout the day"),
    };
  }

  // Expand around peakIndex into a 1–3 hour window while neighbouring hours stay strong
  let start = peakIndex;
  let end = peakIndex;

  while (end - start + 1 < 3) {
    const prevScore = start > 0 ? scoredHours[start - 1].score : -1;
    const nextScore = end < scoredHours.length - 1 ? scoredHours[end + 1].score : -1;

    // Pick whichever adjacent hour is higher and still reasonably close to the peak
    const threshold = Math.max(55, peakHour.score - 12);
    if (prevScore >= nextScore && prevScore >= threshold) {
      start -= 1;
    } else if (nextScore > prevScore && nextScore >= threshold) {
      end += 1;
    } else {
      break;
    }
  }

  const windowSlice = scoredHours.slice(start, end + 1);
  const avgScore = Math.round(
    windowSlice.reduce((sum, item) => sum + item.score, 0) / windowSlice.length
  );

  const startLabel = formatHourLabel(scoredHours[start].time, true);
  const endLabel = formatNextHourLabel(scoredHours[end].time);
  const bestReason = joinReasons(peakHour.goodReasons, "Balanced conditions");

  return {
    scoredHours,
    isGoodDay: true,
    startIndex: start,
    endIndex: end,
    score: avgScore,
    timeRange: `${startLabel} - ${endLabel}`,
    headline: `Best time: ${startLabel} - ${endLabel} (Score ${avgScore}/100)`,
    reason: bestReason,
  };
}

