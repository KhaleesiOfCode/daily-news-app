# Daily News — Bolzano & South Tyrol

A multi-language news aggregator for Bolzano and South Tyrol with weather, live markets, and daily briefing. Supports **English**, **Italiano**, and **Deutsch** interface with a one-click switcher.

## Features

- **17 RSS feeds** from 7 local sources (Alto Adige, Il Dolomiti, Rai TGR, Salto.bz, Stol.it, Suedtirol News, Radio NBC)
- **Categories**: Bolzano, South Tyrol, News, Sport, Culture — filter by topic
- **Language filter**: Italian or German articles
- **Weather widget**: Current conditions + 4-day forecast for Bolzano (via wttr.in)
- **Live markets**: FTSE MIB, DAX, S&P 500, EUR/USD, Bitcoin (via yfinance)
- **Daily briefing**: Curated view with configurable time window (12h–72h)
- **Search**: Full-text across article titles and summaries
- **Multi-lingual UI**: Switch between English, Italian, German — persists via cookie
- **PWA ready**: Add to Home Screen, offline cache, standalone mode
- **Mobile friendly**: Hamburger nav, pull-to-refresh, touch-optimized targets
- **Auto-refresh**: Every 5 minutes (client-side), every 10 minutes (meta fallback)

## Quick Start

```bash
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

### Docker

```bash
docker build -t daily-news .
docker run -p 5000:5000 daily-news
```

## Android APK

The app can be packaged as a real Android APK via **Capacitor** (wraps the web app in a native WebView).

### Option A: GitHub Actions (no local setup)

1. Fork/push to your GitHub repo
2. Go to **Actions** tab → **Build Android APK** → **Run workflow**
3. Enter your deployed app URL (or use `http://localhost:5000` for local-only)
4. Download the APK from the workflow artifacts

### Option B: Local Docker build

```bash
cd capacitor
docker build -f Dockerfile.apk -t daily-news-apk .
docker run --rm -v ${PWD}:/output daily-news-apk
```

### Option C: Local Android Studio

```bash
cd capacitor
npm install
npx cap sync android
npx cap open android
```

Then in Android Studio: **Build → Build Bundle(s) / APK → Build APK**

### Phone setup

1. Enable **Install from unknown apps** in Android settings
2. Open the APK file → tap **Install**
3. Open "Daily News" from your app drawer

**Note:** The APK loads the Flask app from a URL. For local use, run `python app.py` on your PC and keep it on the same network. For standalone use, deploy Flask to Render and update `capacitor.config.json` with the public URL.

## Project Structure

```
daily-news/
├── app.py                  # Flask routes + i18n injection
├── i18n.py                 # Translation engine (EN/IT/DE)
├── news_fetcher.py         # RSS feed parser
├── weather_fetcher.py      # Bolzano weather from wttr.in
├── markets_fetcher.py      # Live market data from yfinance
├── sources.json            # RSS feed configuration
├── requirements.txt
├── Dockerfile
├── translations/
│   ├── en.json
│   ├── it.json
│   └── de.json
├── templates/
│   ├── base.html           # PWA + mobile nav + language switcher
│   ├── dashboard.html      # Weather + markets + Bolzano news
│   ├── news.html           # Filtered article feed
│   ├── briefing.html       # Time-curated news digest
│   └── search.html         # Keyword search
└── static/
    ├── manifest.json        # PWA manifest
    ├── sw.js               # Service worker (offline cache)
    ├── app.js              # Nav toggle + pull-to-refresh + auto-refresh
    └── style.css           # Responsive, mobile-first
```

## News Sources

| Source | Language |
|---|---|
| [Alto Adige](https://www.altoadige.it) | IT |
| [Il Dolomiti](https://www.ildolomiti.it) | IT |
| [Rai TGR Bolzano](https://www.rainews.it/tgr/bolzano) | IT |
| [Salto.bz](https://www.salto.bz) | IT / DE |
| [Stol.it](https://www.stol.it) | DE |
| [Suedtirol News](https://www.suedtirolnews.it) | DE |
| [Radio NBC](https://radionbc.it) | IT |

## Adding Sources

Add entries to `sources.json`:

```json
{
  "name": "Source Name",
  "feed_url": "https://example.com/rss",
  "site_url": "https://example.com",
  "lang": "it",
  "category": "news",
  "description": "Short description"
}
```

Supported categories: `bolzano`, `local`, `news`, `sport`, `culture`
