// Wandelt die Rohdaten von Open-Meteo in eine handliche Struktur um
// und berechnet die "smarten" Hinweise, die andere Wetter-Apps nicht haben.

import { isWetCode } from './weatherCodes.js';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

// Zeiten kommen als lokale Ortszeit "YYYY-MM-DDTHH:mm" – bewusst ohne Date-Zeitzonenlogik parsen.
export function hourOf(isoLocal) {
  return parseInt(isoLocal.slice(11, 13), 10);
}

export function clockOf(isoLocal) {
  return isoLocal ? isoLocal.slice(11, 16) : '–';
}

function weekdayIndex(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${d}.${m}.`;
}

function num(v, fallback = 0) {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

export function normalizeForecast(raw) {
  const { current, hourly, daily } = raw;
  const todayStr = current.time.slice(0, 10);
  const hourKey = current.time.slice(0, 13);

  const days = daily.time.map((date, i) => ({
    date,
    weekday: WEEKDAYS[weekdayIndex(date)],
    weekdayLong: WEEKDAYS_LONG[weekdayIndex(date)],
    code: num(daily.weather_code[i]),
    tempMax: num(daily.temperature_2m_max[i]),
    tempMin: num(daily.temperature_2m_min[i]),
    feelsMax: num(daily.apparent_temperature_max[i]),
    feelsMin: num(daily.apparent_temperature_min[i]),
    precipSum: num(daily.precipitation_sum[i]),
    precipProb: num(daily.precipitation_probability_max[i]),
    windMax: num(daily.wind_speed_10m_max[i]),
    gustsMax: num(daily.wind_gusts_10m_max[i]),
    uvMax: num(daily.uv_index_max[i]),
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
  }));

  let todayIdx = days.findIndex((d) => d.date === todayStr);
  if (todayIdx < 0) todayIdx = 0;

  const allHours = hourly.time.map((time, i) => ({
    time,
    hour: hourOf(time),
    date: time.slice(0, 10),
    temp: num(hourly.temperature_2m[i]),
    feels: num(hourly.apparent_temperature[i]),
    prob: num(hourly.precipitation_probability[i]),
    precip: num(hourly.precipitation[i]),
    code: num(hourly.weather_code[i]),
    wind: num(hourly.wind_speed_10m[i]),
    uv: num(hourly.uv_index[i]),
    isDay: hourly.is_day[i] === 1,
  }));

  let nowIdx = allHours.findIndex((h) => h.time.slice(0, 13) === hourKey);
  if (nowIdx < 0) nowIdx = 0;

  const upcoming = days.slice(todayIdx);

  return {
    timezone: raw.timezone,
    current: {
      time: current.time,
      temp: num(current.temperature_2m),
      feels: num(current.apparent_temperature),
      humidity: num(current.relative_humidity_2m),
      isDay: current.is_day === 1,
      precip: num(current.precipitation),
      code: num(current.weather_code),
      wind: num(current.wind_speed_10m),
      gusts: num(current.wind_gusts_10m),
      uv: num(current.uv_index),
    },
    today: days[todayIdx],
    yesterday: todayIdx > 0 ? days[todayIdx - 1] : null,
    days: upcoming,
    hours: allHours.slice(nowIdx, nowIdx + 25),
    restOfToday: allHours.slice(nowIdx).filter((h) => h.date === todayStr),
  };
}

function isWetHour(h) {
  return h.prob >= 50 || h.precip >= 0.3 || isWetCode(h.code);
}

/** Wann fängt Regen an / hört er auf? */
export function rainInsight(hours) {
  const next = hours.slice(0, 12);
  if (next.length === 0) return null;
  const nowWet = next[0].precip >= 0.1 || isWetCode(next[0].code);

  if (nowWet) {
    const dry = next.findIndex((h, i) => i > 0 && !isWetHour(h));
    if (dry > 0) {
      return { icon: '🌂', text: `Regen hört gegen ${next[dry].hour} Uhr auf.` };
    }
    return { icon: '☔', text: 'Regen hält die nächsten Stunden an – Schirm mitnehmen.' };
  }

  const wetIdx = next.findIndex((h, i) => i > 0 && isWetHour(h));
  if (wetIdx > 0) {
    const h = next[wetIdx];
    return {
      icon: '☂️',
      text: `Ab ca. ${h.hour} Uhr Regen wahrscheinlich (${Math.round(h.prob)} %) – Schirm einpacken.`,
    };
  }

  const maxProb = Math.max(...next.map((h) => h.prob));
  if (maxProb < 20) {
    return { icon: '✅', text: 'Die nächsten 12 Stunden bleibt es trocken.' };
  }
  return { icon: '🌥️', text: `Kleines Regenrisiko (max. ${Math.round(maxProb)} %) in den nächsten 12 Std.` };
}

/** Vergleich mit gestern – "Brauche ich heute mehr als gestern?" */
export function yesterdayInsight(today, yesterday) {
  if (!today || !yesterday) return null;
  const diff = Math.round(today.tempMax - yesterday.tempMax);
  if (diff >= 2) return { icon: '📈', text: `Heute ${diff}° wärmer als gestern.` };
  if (diff <= -2) return { icon: '📉', text: `Heute ${-diff}° kälter als gestern – etwas wärmer anziehen.` };
  return { icon: '↔️', text: 'Ähnliche Temperaturen wie gestern.' };
}

/** Bestes 2-Stunden-Fenster für draußen im Rest des Tages (nur bei Tageslicht). */
export function bestTimeInsight(restOfToday) {
  const daylight = restOfToday.filter((h) => h.isDay);
  if (daylight.length < 2) return null;

  let best = null;
  for (let i = 0; i < daylight.length - 1; i++) {
    const a = daylight[i];
    const b = daylight[i + 1];
    if (b.hour !== a.hour + 1) continue;
    const feels = (a.feels + b.feels) / 2;
    const prob = Math.max(a.prob, b.prob);
    const wind = Math.max(a.wind, b.wind);
    const score = -Math.abs(feels - 21) - prob / 8 - wind / 10;
    if (!best || score > best.score) best = { score, a, b, feels, prob };
  }
  if (!best) return null;

  const dry = best.prob < 30 ? 'trocken' : `${Math.round(best.prob)} % Regen`;
  return {
    icon: '🚶',
    text: `Beste Zeit für draußen: ${best.a.hour}–${best.b.hour + 1} Uhr (${Math.round(best.feels)}°, ${dry}).`,
  };
}

/** Frostwarnung für die kommende Nacht. */
export function frostInsight(days) {
  const tomorrow = days[1];
  if (tomorrow && tomorrow.tempMin <= 0) {
    return { icon: '🧊', text: `Nachtfrost bis ${Math.round(tomorrow.tempMin)}° – Autoscheibe & Pflanzen schützen.` };
  }
  return null;
}

export function buildInsights(f) {
  return [
    rainInsight(f.hours),
    yesterdayInsight(f.today, f.yesterday),
    bestTimeInsight(f.restOfToday),
    frostInsight(f.days),
  ].filter(Boolean);
}
