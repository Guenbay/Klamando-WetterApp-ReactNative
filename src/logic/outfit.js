// Kleidungsempfehlung – Herzstück von Klamando.
// Berücksichtigt gefühlte Temperatur, Regen, Schnee, Wind, UV und Temperaturspanne.

import { isSnowCode, isWetCode } from './weatherCodes.js';

const ITEMS = {
  thermal: { emoji: '🧦', label: 'Thermo-Unterwäsche' },
  downJacket: { emoji: '🧥', label: 'Dicke Winterjacke' },
  winterJacket: { emoji: '🧥', label: 'Winterjacke' },
  warmJacket: { emoji: '🧥', label: 'Warme Jacke' },
  lightJacket: { emoji: '🧥', label: 'Übergangsjacke' },
  rainJacket: { emoji: '🧥', label: 'Regenjacke' },
  hoodie: { emoji: '👚', label: 'Hoodie / dünner Pulli' },
  sweater: { emoji: '🧶', label: 'Pullover' },
  longSleeve: { emoji: '👕', label: 'Langarmshirt' },
  tshirt: { emoji: '👕', label: 'T-Shirt' },
  top: { emoji: '🎽', label: 'Luftiges Top' },
  jeans: { emoji: '👖', label: 'Lange Hose' },
  warmPants: { emoji: '👖', label: 'Gefütterte Hose' },
  shorts: { emoji: '🩳', label: 'Shorts / Rock' },
  hat: { emoji: '👒', label: 'Sonnenhut' },
  cap: { emoji: '🧢', label: 'Cap' },
  beanie: { emoji: '🧣', label: 'Mütze & Schal' },
  gloves: { emoji: '🧤', label: 'Handschuhe' },
  boots: { emoji: '🥾', label: 'Winterstiefel' },
  waterproofShoes: { emoji: '🥾', label: 'Wasserfeste Schuhe' },
  sneakers: { emoji: '👟', label: 'Sneaker' },
  sandals: { emoji: '🩴', label: 'Sandalen' },
  umbrella: { emoji: '☂️', label: 'Regenschirm' },
  sunglasses: { emoji: '🕶️', label: 'Sonnenbrille' },
  sunscreen: { emoji: '🧴', label: 'Sonnencreme' },
  water: { emoji: '💧', label: 'Wasserflasche' },
};

// Temperaturstufen nach gefühlter Temperatur (°C)
function baseLayer(feels) {
  if (feels <= -5) {
    return {
      mood: 'Eisig', headline: 'Eisig – dick einpacken!',
      items: ['thermal', 'downJacket', 'sweater', 'warmPants', 'beanie', 'gloves', 'boots'],
    };
  }
  if (feels <= 5) {
    return {
      mood: 'Kalt', headline: 'Kalt – Winterjacke an',
      items: ['winterJacket', 'sweater', 'jeans', 'beanie', 'gloves', 'boots'],
    };
  }
  if (feels <= 10) {
    return {
      mood: 'Frisch', headline: 'Frisch – warme Jacke empfohlen',
      items: ['warmJacket', 'sweater', 'jeans', 'sneakers'],
    };
  }
  if (feels <= 15) {
    return {
      mood: 'Kühl', headline: 'Kühl – Übergangsjacke reicht',
      items: ['lightJacket', 'longSleeve', 'jeans', 'sneakers'],
    };
  }
  if (feels <= 20) {
    return {
      mood: 'Mild', headline: 'Mild – Hoodie oder leichte Jacke',
      items: ['hoodie', 'tshirt', 'jeans', 'sneakers'],
    };
  }
  if (feels <= 25) {
    return {
      mood: 'Angenehm', headline: 'Angenehm – T-Shirt-Wetter',
      items: ['tshirt', 'jeans', 'sneakers'],
    };
  }
  if (feels <= 30) {
    return {
      mood: 'Warm', headline: 'Warm – kurz & luftig',
      items: ['tshirt', 'shorts', 'sandals', 'cap'],
    };
  }
  return {
    mood: 'Heiß', headline: 'Heiß – so wenig wie möglich',
    items: ['top', 'shorts', 'sandals', 'hat', 'water'],
  };
}

const JACKETS = ['downJacket', 'winterJacket', 'warmJacket', 'lightJacket'];

/**
 * @param {object} w
 * @param {number} w.feels      maßgebliche gefühlte Temperatur
 * @param {number} [w.tempMin]  Tagesminimum (für Zwiebellook)
 * @param {number} [w.tempMax]  Tagesmaximum
 * @param {number} [w.precipProb] Regenwahrscheinlichkeit in %
 * @param {number} [w.precipSum]  Niederschlag in mm
 * @param {number} [w.wind]     Wind km/h
 * @param {number} [w.gusts]    Böen km/h
 * @param {number} [w.uv]       UV-Index
 * @param {number} [w.code]     WMO-Wettercode
 * @returns {{headline: string, items: {emoji: string, label: string}[], tips: string[]}}
 */
export function recommendOutfit(w) {
  const {
    feels,
    tempMin,
    tempMax,
    precipProb = 0,
    precipSum = 0,
    wind = 0,
    gusts = 0,
    uv = 0,
    code = 0,
  } = w;

  const base = baseLayer(feels);
  let headline = base.headline;
  let keys = [...base.items];
  const tips = [];

  const snow = isSnowCode(code);
  const wet = isWetCode(code) || precipProb >= 50 || precipSum >= 1;
  const stormy = wind >= 40 || gusts >= 60;

  if (wet && !snow) {
    headline = feels > 5 ? `${base.mood} & nass – Regenjacke an` : `${base.mood} & nass – warm und wasserdicht`;
    if (feels > 5) {
      // Regenjacke ersetzt leichte Jacken, bei Wärme kommt sie dazu
      const idx = keys.findIndex((k) => JACKETS.includes(k));
      if (idx >= 0 && keys[idx] !== 'warmJacket') keys[idx] = 'rainJacket';
      else if (idx < 0) keys.unshift('rainJacket');
      else tips.push('Achte auf eine wasserdichte Jacke.');
    }
    if (stormy) {
      tips.push('Zu windig für einen Schirm – nimm lieber eine Kapuze.');
    } else {
      keys.push('umbrella');
    }
    keys = keys.map((k) => (k === 'sneakers' || k === 'sandals' ? 'waterproofShoes' : k));
    if (precipProb >= 50 && precipProb < 80) {
      tips.push(`Regenrisiko ${Math.round(precipProb)} % – Schirm lieber einpacken.`);
    }
  }

  if (snow) {
    headline = `${base.mood} & Schnee – warme Stiefel an`;
    keys = keys.map((k) => (k === 'sneakers' || k === 'waterproofShoes' ? 'boots' : k));
    if (!keys.includes('boots')) keys.push('boots');
    if (!keys.includes('gloves')) keys.push('gloves');
    tips.push('Schnee: rutschfeste Schuhe tragen.');
  }

  if (stormy) {
    tips.push(`Starker Wind (Böen bis ${Math.round(Math.max(wind, gusts))} km/h) – winddichte Jacke!`);
  } else if (wind >= 25 && feels <= 15) {
    tips.push('Frischer Wind – es fühlt sich kälter an, Kragen hoch.');
  }

  if (uv >= 6) {
    if (!keys.includes('sunglasses')) keys.push('sunglasses');
    keys.push('sunscreen');
    if (!keys.includes('hat') && !keys.includes('cap')) keys.push('cap');
    tips.push(`Hoher UV-Index (${Math.round(uv)}) – Sonnenschutz nicht vergessen.`);
  } else if (uv >= 3 && !wet) {
    if (!keys.includes('sunglasses')) keys.push('sunglasses');
  }

  if (typeof tempMin === 'number' && typeof tempMax === 'number') {
    const spread = tempMax - tempMin;
    if (spread >= 10) {
      tips.push(
        `Zwiebellook: ${Math.round(tempMin)}° am Morgen, ${Math.round(tempMax)}° am Nachmittag.`
      );
    }
  }

  if (feels >= 30 && !keys.includes('water')) keys.push('water');

  const unique = [...new Set(keys)];
  return {
    headline,
    items: unique.map((k) => ITEMS[k]),
    tips,
  };
}

/** Empfehlung für einen Tag aus den Tagesdaten (Tageshöchstwerte zählen). */
export function recommendForDay(day) {
  // Tagsüber zählt eher der wärmere Teil, morgens der kühlere – Mittelwert gewichtet zum Max.
  const feels = day.feelsMin + (day.feelsMax - day.feelsMin) * 0.6;
  return recommendOutfit({
    feels,
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    precipProb: day.precipProb,
    precipSum: day.precipSum,
    wind: day.windMax,
    gusts: day.gustsMax,
    uv: day.uvMax,
    code: day.code,
  });
}
