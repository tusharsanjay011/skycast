# SkyCast

SkyCast is a clean, responsive weather web app built with **React (Vite)** and **plain CSS**. It uses the free **Open-Meteo** APIs (no API key required) to deliver live weather conditions, 24-hour and 7-day forecasts, and a unique **Plan My Day** activity planner that scores each hour to help you pick the best time to go outside.

## Live Demo

- **Live URL:** _[Add your deployed Vercel or GitHub Pages URL here]_

## Screenshots

> _Placeholder — add screenshots of the empty state, current weather + Plan My Day bar, and mobile view here._
>
> - `![Desktop View](./screenshots/desktop-preview.png)`
> - `![Plan My Day View](./screenshots/plan-my-day.png)`

## Features

- **City Search with Suggestions:** Type any city to get up to 5 geocoding matches (city, state, country) with full keyboard navigation.
- **Use My Location:** One-click browser Geolocation lookup to load your local forecast.
- **Current Weather Card:** Shows temperature, feels-like temperature, condition icon & description, humidity, wind speed, and UV index.
- **24-Hour Scrollable Strip:** Horizontally scrollable hourly breakdown starting from the current local hour at that location.
- **Plan My Day ("Best Time to Go Out"):**
  - Pick an activity: **Running**, **Cycling**, **Walking**, **Cricket/Outdoor Sports**, **Drying Clothes**, or **Photography (golden hour)**.
  - Scores each of the next 24 hours (`0–100`) using configurable rules in `src/utils/activityScore.js`.
  - Displays a colour-coded scrollable hourly bar (green = great, yellow = okay, red = avoid) and highlights the best time window with a short reason — or warns `"Not a good day for this activity"` if no hour scores above 50.
  - Includes an expandable **"How scores are calculated"** guide and remembers your last selected activity in `localStorage`.
- **7-Day Forecast:** Daily cards with day name, date, condition icon, description, and high/low temperatures.
- **Favourite Locations:** Star any city to save/remove it as a clickable chip on the home screen (persisted in `localStorage`).
- **Unit Toggle:** Switch seamlessly between `°C / km/h` and `°F / mph` without extra API requests (remembered in `localStorage`).
- **Dynamic Weather Backgrounds:** Pure-CSS animated backgrounds that adapt to sunny, cloudy, rain, snow, thunderstorm, and fog conditions for both day and night, while respecting `prefers-reduced-motion`.
- **Friendly States:** Loading spinners, clear offline/error messages, and a welcoming empty state before the first search.

## Tech Stack

- **Frontend:** React 18, Vite 5
- **Styling:** Plain CSS (glassmorphism cards, CSS Grid/Flexbox, responsive mobile-first design)
- **APIs:**
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  - [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs)
  - Browser Geolocation API (with best-effort OpenStreetMap Nominatim reverse geocoding)

## Project Structure

```text
src/
├── components/
│   ├── CurrentWeather.jsx
│   ├── DailyForecast.jsx
│   ├── Favourites.jsx
│   ├── HourlyForecast.jsx
│   ├── PlanMyDay.jsx
│   ├── SearchBar.jsx
│   ├── UnitToggle.jsx
│   └── WeatherBackground.jsx
├── hooks/
│   ├── useLocalStorage.js
│   └── useWeather.js
├── utils/
│   ├── activityScore.js
│   ├── formatters.js
│   └── weatherCodes.js
├── App.css
├── App.jsx
└── main.jsx
```

## Getting Started

No API keys or `.env` files are needed.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

To create a production build locally:

```bash
npm run build
npm run preview
```

## Deployment

`vite.config.js` sets `base: "./"`, so the built `dist/` folder works on both **Vercel** and **GitHub Pages**.

### Option 1: Deploy to GitHub Pages (Included Workflow)

This repository includes `.github/workflows/deploy.yml`.

1. Push your code to a GitHub repository on the `main` branch.
2. Open your repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Push a commit (or trigger **Actions → Deploy SkyCast to GitHub Pages → Run workflow**).
5. Your app will be published at `https://<your-username>.github.io/<your-repo>/`.

### Option 2: Deploy to Vercel

1. Push your repository to GitHub (or GitLab/Bitbucket).
2. Sign in at [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import your `skycast` repository.
4. Keep the default Vite settings (**Build Command:** `npm run build`, **Output Directory:** `dist`) and click **Deploy**.
5. Vercel will build and give you a live `https://*.vercel.app` link automatically on every push.
