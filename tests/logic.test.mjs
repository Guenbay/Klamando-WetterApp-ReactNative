import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendOutfit, recommendForDay } from '../src/logic/outfit.js';
import {
  normalizeForecast,
  rainInsight,
  yesterdayInsight,
  bestTimeInsight,
  buildInsights,
} from '../src/logic/forecast.js';
import { describeWeather } from '../src/logic/weatherCodes.js';
import { makeRaw } from './fixture.mjs';

const labels = (o) => o.items.map((i) => i.label);

test('Winter: Winterjacke, Mütze, Handschuhe', () => {
  const o = recommendOutfit({ feels: -2, code: 3 });
  assert.ok(labels(o).includes('Winterjacke'));
  assert.ok(labels(o).includes('Handschuhe'));
  assert.ok(labels(o).includes('Mütze & Schal'));
});

test('Hitze: Shorts, Sandalen, Wasser, Sonnencreme bei hohem UV', () => {
  const o = recommendOutfit({ feels: 33, uv: 8, code: 0 });
  const l = labels(o);
  assert.ok(l.includes('Shorts / Rock'));
  assert.ok(l.includes('Sandalen'));
  assert.ok(l.includes('Wasserflasche'));
  assert.ok(l.includes('Sonnencreme'));
});

test('Regen bei 14°: Regenjacke, Schirm, wasserfeste Schuhe', () => {
  const o = recommendOutfit({ feels: 14, precipProb: 80, precipSum: 4, code: 63 });
  const l = labels(o);
  assert.ok(l.includes('Regenjacke'));
  assert.ok(l.includes('Regenschirm'));
  assert.ok(l.includes('Wasserfeste Schuhe'));
  assert.ok(!l.includes('Sneaker'));
});

test('Regen + Sturm: kein Schirm, Kapuzen-Tipp', () => {
  const o = recommendOutfit({ feels: 12, precipProb: 90, code: 65, wind: 50, gusts: 80 });
  assert.ok(!labels(o).includes('Regenschirm'));
  assert.ok(o.tips.some((t) => t.includes('Kapuze')));
});

test('Schnee: Winterstiefel statt Sneaker', () => {
  const o = recommendOutfit({ feels: 8, code: 73 });
  assert.ok(labels(o).includes('Winterstiefel'));
  assert.ok(!labels(o).includes('Sneaker'));
});

test('Große Temperaturspanne → Zwiebellook-Tipp', () => {
  const o = recommendOutfit({ feels: 18, tempMin: 6, tempMax: 22 });
  assert.ok(o.tips.some((t) => t.startsWith('Zwiebellook')));
});

test('Keine doppelten Items', () => {
  const o = recommendOutfit({ feels: 28, uv: 9, code: 0 });
  assert.equal(new Set(labels(o)).size, o.items.length);
});

test('Unbekannter Wettercode bricht nicht', () => {
  assert.equal(describeWeather(1234).label, 'Unbekannt');
});

test('normalizeForecast: heute, gestern, 16 Tage, 25 Stunden', () => {
  const f = normalizeForecast(makeRaw());
  assert.equal(f.today.date, '2026-09-25');
  assert.equal(f.yesterday.date, '2026-09-24');
  assert.equal(f.days.length, 16);
  assert.equal(f.days[0].date, '2026-09-25');
  assert.equal(f.hours.length, 25);
  assert.equal(f.hours[0].hour, 10);
  assert.ok(f.restOfToday.every((h) => h.date === '2026-09-25'));
  assert.equal(typeof f.days[3].weekday, 'string');
});

test('recommendForDay liefert Empfehlung für jeden Tag', () => {
  const f = normalizeForecast(makeRaw());
  for (const d of f.days) {
    const o = recommendForDay(d);
    assert.ok(o.items.length > 0);
  }
});

test('rainInsight erkennt kommenden Regen', () => {
  const hours = Array.from({ length: 12 }, (_, i) => ({
    hour: 10 + i, prob: i >= 5 ? 80 : 5, precip: i >= 5 ? 1 : 0, code: i >= 5 ? 63 : 1, wind: 5,
  }));
  assert.match(rainInsight(hours).text, /Ab ca\. 15 Uhr/);
});

test('rainInsight erkennt Regenende', () => {
  const hours = Array.from({ length: 12 }, (_, i) => ({
    hour: 10 + i, prob: i < 3 ? 90 : 5, precip: i < 3 ? 2 : 0, code: i < 3 ? 63 : 2, wind: 5,
  }));
  assert.match(rainInsight(hours).text, /hört gegen 13 Uhr auf/);
});

test('yesterdayInsight', () => {
  assert.match(yesterdayInsight({ tempMax: 20 }, { tempMax: 15 }).text, /5° wärmer/);
  assert.match(yesterdayInsight({ tempMax: 10 }, { tempMax: 15 }).text, /5° kälter/);
});

test('bestTimeInsight wählt trockenes, angenehmes Fenster', () => {
  const rest = [10, 11, 12, 13, 14, 15].map((hour) => ({
    hour, isDay: true, feels: hour === 13 || hour === 14 ? 21 : 12, prob: hour === 13 ? 0 : 10, wind: 5,
  }));
  assert.match(bestTimeInsight(rest).text, /13–15 Uhr/);
});

test('buildInsights auf Fixture', () => {
  const insights = buildInsights(normalizeForecast(makeRaw()));
  assert.ok(insights.length >= 2);
});

test('Überschrift passt zu Regen und Schnee', () => {
  assert.match(recommendOutfit({ feels: 14, code: 63 }).headline, /Regenjacke/);
  assert.match(recommendOutfit({ feels: -3, code: 73 }).headline, /Schnee/);
  assert.match(recommendOutfit({ feels: 22, code: 0 }).headline, /T-Shirt/);
});
