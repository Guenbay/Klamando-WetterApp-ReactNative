// Künstliche Open-Meteo-Antwort (gestern + 16 Tage) für Tests und Offline-Demo.

const pad = (n) => String(n).padStart(2, '0');

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function makeRaw({ today = '2026-09-25', hour = 10, code = 2, isDay = 1 } = {}) {
  const start = addDays(today, -1);
  const dayCount = 17;
  const daily = {
    time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [],
    apparent_temperature_max: [], apparent_temperature_min: [], precipitation_sum: [],
    precipitation_probability_max: [], wind_speed_10m_max: [], wind_gusts_10m_max: [],
    uv_index_max: [], sunrise: [], sunset: [],
  };
  const codes = [2, 2, 61, 0, 3, 80, 1, 0, 63, 45, 2, 71, 0, 1, 3, 95, 2];
  for (let i = 0; i < dayCount; i++) {
    const date = addDays(start, i);
    const max = 16 + Math.round(6 * Math.sin(i / 2));
    daily.time.push(date);
    daily.weather_code.push(codes[i]);
    daily.temperature_2m_max.push(max);
    daily.temperature_2m_min.push(max - 9);
    daily.apparent_temperature_max.push(max - 1);
    daily.apparent_temperature_min.push(max - 11);
    daily.precipitation_sum.push([61, 80, 63, 71, 95].includes(codes[i]) ? 4.2 : 0);
    daily.precipitation_probability_max.push([61, 80, 63, 71, 95].includes(codes[i]) ? 75 : 10);
    daily.wind_speed_10m_max.push(18);
    daily.wind_gusts_10m_max.push(35);
    daily.uv_index_max.push(4);
    daily.sunrise.push(`${date}T07:10`);
    daily.sunset.push(`${date}T19:05`);
  }
  const hourly = {
    time: [], temperature_2m: [], apparent_temperature: [], precipitation_probability: [],
    precipitation: [], weather_code: [], wind_speed_10m: [], uv_index: [], is_day: [],
  };
  for (let d = 0; d < dayCount; d++) {
    const date = addDays(start, d);
    for (let h = 0; h < 24; h++) {
      const t = 10 + 8 * Math.sin(((h - 8) / 24) * Math.PI * 2);
      hourly.time.push(`${date}T${pad(h)}:00`);
      hourly.temperature_2m.push(Math.round(t * 10) / 10);
      hourly.apparent_temperature.push(Math.round((t - 1.5) * 10) / 10);
      const rainy = d === 1 && h >= 16 && h <= 19;
      hourly.precipitation_probability.push(rainy ? 70 : 5);
      hourly.precipitation.push(rainy ? 0.8 : 0);
      hourly.weather_code.push(rainy ? 61 : 2);
      hourly.wind_speed_10m.push(12);
      hourly.uv_index.push(h >= 9 && h <= 16 ? 3 : 0);
      hourly.is_day.push(h >= 7 && h < 19 ? 1 : 0);
    }
  }
  return {
    timezone: 'Europe/Berlin',
    current: {
      time: `${today}T${pad(hour)}:15`,
      temperature_2m: 14.3,
      apparent_temperature: 12.8,
      relative_humidity_2m: 71,
      is_day: isDay,
      precipitation: 0,
      weather_code: code,
      wind_speed_10m: 14,
      wind_gusts_10m: 30,
      uv_index: 2.5,
    },
    hourly,
    daily,
  };
}
