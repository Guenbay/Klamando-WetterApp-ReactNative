// Hintergrundfarben je nach Wetterlage, Tageszeit und Temperatur.

const GRADIENTS = {
  clearHot: ['#ff9a44', '#fc6076', '#b0305b'],
  clear: ['#2f80ed', '#56ccf2', '#7fd3f7'],
  clearCold: ['#4b79a1', '#8fb8de', '#c9dff2'],
  partly: ['#3a7bd5', '#6f9fd8', '#9fb8d0'],
  cloudy: ['#5d6d7e', '#8394a5', '#a3b1bf'],
  fog: ['#757f8a', '#9aa3ab', '#b9c0c6'],
  rain: ['#232f3e', '#3d5068', '#5a6f86'],
  snow: ['#7b93ad', '#a9c1d9', '#d6e4f0'],
  thunder: ['#141e30', '#2c3550', '#4a4a6a'],
  night: ['#0f2027', '#203a43', '#2c5364'],
  nightRain: ['#0b1320', '#1b2838', '#2a3a4f'],
};

export function themeFor(kind, isDay, temp) {
  let key;
  if (!isDay) {
    key = kind === 'rain' || kind === 'thunder' ? 'nightRain' : kind === 'snow' ? 'snow' : 'night';
  } else if (kind === 'clear') {
    key = temp >= 27 ? 'clearHot' : temp <= 3 ? 'clearCold' : 'clear';
  } else {
    key = kind;
  }
  const colors = GRADIENTS[key] || GRADIENTS.cloudy;
  // Heller Hintergrund (Schnee/Nebel) → Karten dunkler, damit weiße Schrift lesbar bleibt
  const lightBg = key === 'snow' || key === 'fog' || key === 'clearCold';
  return {
    colors,
    card: lightBg ? 'rgba(20,35,55,0.38)' : 'rgba(255,255,255,0.16)',
    cardStrong: lightBg ? 'rgba(20,35,55,0.5)' : 'rgba(0,0,0,0.22)',
    text: '#ffffff',
    textDim: 'rgba(255,255,255,0.78)',
    accent: '#ffd166',
    tabBar: 'rgba(0,0,0,0.35)',
  };
}
