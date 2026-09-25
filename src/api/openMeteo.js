// Open-Meteo: kostenlose Wetter-API, kein API-Key, bis zu 16 Tage Vorhersage.
// Doku: https://open-meteo.com/en/docs

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 12000;

const CURRENT_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'is_day',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'uv_index',
];

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'uv_index',
  'is_day',
];

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'uv_index_max',
  'sunrise',
  'sunset',
];

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Server antwortet mit ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function query(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Lädt aktuelles Wetter, 48h stündlich und 16 Tage täglich (plus gestern zum Vergleich).
 */
export async function fetchForecast(latitude, longitude) {
  const url =
    FORECAST_URL +
    '?' +
    query({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: CURRENT_VARS.join(','),
      hourly: HOURLY_VARS.join(','),
      daily: DAILY_VARS.join(','),
      timezone: 'auto',
      forecast_days: 16,
      past_days: 1,
      wind_speed_unit: 'kmh',
    });
  const data = await getJson(url);
  if (!data || !data.current || !data.daily || !data.hourly) {
    throw new Error('Unerwartete Antwort der Wetter-API');
  }
  return data;
}

/**
 * Ortssuche (Städte, Dörfer, PLZ) weltweit.
 */
export async function searchPlaces(name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) return [];
  const url =
    GEOCODING_URL +
    '?' +
    query({ name: trimmed, count: 10, language: 'de', format: 'json' });
  const data = await getJson(url);
  return (data.results || []).map((r) => ({
    id: String(r.id),
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
