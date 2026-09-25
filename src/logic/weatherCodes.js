// WMO-Wettercodes, wie sie Open-Meteo liefert.
// kind wird für Hintergrund/Animation genutzt.

const CODES = {
  0: { label: 'Klar', day: '☀️', night: '🌙', kind: 'clear' },
  1: { label: 'Überwiegend klar', day: '🌤️', night: '🌙', kind: 'clear' },
  2: { label: 'Teilweise bewölkt', day: '⛅', night: '☁️', kind: 'partly' },
  3: { label: 'Bedeckt', day: '☁️', night: '☁️', kind: 'cloudy' },
  45: { label: 'Nebel', day: '🌫️', night: '🌫️', kind: 'fog' },
  48: { label: 'Reifnebel', day: '🌫️', night: '🌫️', kind: 'fog' },
  51: { label: 'Leichter Nieselregen', day: '🌦️', night: '🌧️', kind: 'rain' },
  53: { label: 'Nieselregen', day: '🌦️', night: '🌧️', kind: 'rain' },
  55: { label: 'Starker Nieselregen', day: '🌧️', night: '🌧️', kind: 'rain' },
  56: { label: 'Gefrierender Niesel', day: '🌧️', night: '🌧️', kind: 'rain' },
  57: { label: 'Gefrierender Niesel', day: '🌧️', night: '🌧️', kind: 'rain' },
  61: { label: 'Leichter Regen', day: '🌦️', night: '🌧️', kind: 'rain' },
  63: { label: 'Regen', day: '🌧️', night: '🌧️', kind: 'rain' },
  65: { label: 'Starker Regen', day: '🌧️', night: '🌧️', kind: 'rain' },
  66: { label: 'Gefrierender Regen', day: '🌧️', night: '🌧️', kind: 'rain' },
  67: { label: 'Gefrierender Regen', day: '🌧️', night: '🌧️', kind: 'rain' },
  71: { label: 'Leichter Schneefall', day: '🌨️', night: '🌨️', kind: 'snow' },
  73: { label: 'Schneefall', day: '🌨️', night: '🌨️', kind: 'snow' },
  75: { label: 'Starker Schneefall', day: '❄️', night: '❄️', kind: 'snow' },
  77: { label: 'Schneegriesel', day: '🌨️', night: '🌨️', kind: 'snow' },
  80: { label: 'Regenschauer', day: '🌦️', night: '🌧️', kind: 'rain' },
  81: { label: 'Regenschauer', day: '🌧️', night: '🌧️', kind: 'rain' },
  82: { label: 'Heftige Schauer', day: '⛈️', night: '⛈️', kind: 'rain' },
  85: { label: 'Schneeschauer', day: '🌨️', night: '🌨️', kind: 'snow' },
  86: { label: 'Starke Schneeschauer', day: '❄️', night: '❄️', kind: 'snow' },
  95: { label: 'Gewitter', day: '⛈️', night: '⛈️', kind: 'thunder' },
  96: { label: 'Gewitter mit Hagel', day: '⛈️', night: '⛈️', kind: 'thunder' },
  99: { label: 'Gewitter mit Hagel', day: '⛈️', night: '⛈️', kind: 'thunder' },
};

const UNKNOWN = { label: 'Unbekannt', day: '🌡️', night: '🌡️', kind: 'cloudy' };

export function describeWeather(code, isDay = true) {
  const entry = CODES[code] || UNKNOWN;
  return {
    label: entry.label,
    emoji: isDay ? entry.day : entry.night,
    kind: entry.kind,
  };
}

export function isWetCode(code) {
  const kind = (CODES[code] || UNKNOWN).kind;
  return kind === 'rain' || kind === 'snow' || kind === 'thunder';
}

export function isSnowCode(code) {
  return (CODES[code] || UNKNOWN).kind === 'snow';
}
