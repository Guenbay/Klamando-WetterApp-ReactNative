import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, OutfitList } from '../components/ui';
import { describeWeather } from '../logic/weatherCodes';
import { clockOf, formatDate } from '../logic/forecast';
import { recommendForDay } from '../logic/outfit';

const RANGES = [7, 14];

function TempBar({ min, max, lo, hi }) {
  const span = Math.max(hi - lo, 1);
  const left = ((min - lo) / span) * 100;
  const width = Math.max(((max - min) / span) * 100, 4);
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { left: `${left}%`, width: `${width}%` }]} />
    </View>
  );
}

function DayRow({ theme, day, index, lo, hi, expanded, onToggle }) {
  const w = describeWeather(day.code, true);
  const outfit = useMemo(() => recommendForDay(day), [day]);
  const title = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : day.weekday;

  return (
    <Card theme={theme} style={styles.dayCard}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`${day.weekdayLong} Details`}>
        <View style={styles.row}>
          <View style={styles.dayName}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.dayDate, { color: theme.textDim }]}>{formatDate(day.date)}</Text>
          </View>
          <Text style={styles.dayEmoji}>{w.emoji}</Text>
          <Text style={[styles.rain, { opacity: day.precipProb >= 10 ? 1 : 0.35 }]}>
            💧{Math.round(day.precipProb)}%
          </Text>
          <Text style={[styles.tMin, { color: theme.textDim }]}>{Math.round(day.tempMin)}°</Text>
          <TempBar min={day.tempMin} max={day.tempMax} lo={lo} hi={hi} />
          <Text style={[styles.tMax, { color: theme.text }]}>{Math.round(day.tempMax)}°</Text>
        </View>
        <Text style={[styles.outfitPreview, { color: theme.textDim }]} numberOfLines={1}>
          {outfit.items.slice(0, 6).map((i) => i.emoji).join(' ')}  {outfit.headline}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          <Text style={[styles.detailLine, { color: theme.text }]}>
            {w.label} · gefühlt {Math.round(day.feelsMin)}° bis {Math.round(day.feelsMax)}°
          </Text>
          <Text style={[styles.detailLine, { color: theme.text }]}>
            🌧️ {day.precipSum.toFixed(1)} mm · 💨 {Math.round(day.windMax)} km/h (Böen {Math.round(day.gustsMax)}) · ☀️ UV {Math.round(day.uvMax)}
          </Text>
          <Text style={[styles.detailLine, { color: theme.text }]}>
            🌅 {clockOf(day.sunrise)} · 🌇 {clockOf(day.sunset)}
          </Text>
          <View style={styles.divider} />
          <OutfitList theme={theme} outfit={outfit} compact />
        </View>
      ) : null}
    </Card>
  );
}

export function ForecastScreen({ theme, forecast, loading, onRefresh }) {
  const [range, setRange] = useState(7);
  const [open, setOpen] = useState(null);
  const days = forecast.days.slice(0, range);
  const lo = Math.min(...days.map((d) => d.tempMin));
  const hi = Math.max(...days.map((d) => d.tempMax));

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={[styles.segment, { backgroundColor: theme.cardStrong }]}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[styles.segmentBtn, range === r && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: range === r }}
          >
            <Text style={[styles.segmentText, range === r && styles.segmentTextActive]}>{r} Tage</Text>
          </Pressable>
        ))}
      </View>

      {days.map((day, i) => (
        <View key={day.date}>
          {i === 7 ? (
            <Text style={[styles.trendNote, { color: theme.textDim }]}>
              Ab Tag 8: Trend – Vorhersagen werden ungenauer.
            </Text>
          ) : null}
          <DayRow
            theme={theme}
            day={day}
            index={i}
            lo={lo}
            hi={hi}
            expanded={open === day.date}
            onToggle={() => setOpen(open === day.date ? null : day.date)}
          />
        </View>
      ))}
      <Text style={[styles.hint, { color: theme.textDim }]}>Tippe auf einen Tag für Details & Outfit.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  segment: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#ffffff' },
  segmentText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  segmentTextActive: { color: '#1d2b3a' },
  dayCard: { paddingVertical: 12, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dayName: { width: 62 },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  dayDate: { fontSize: 12 },
  dayEmoji: { fontSize: 26, width: 38, textAlign: 'center' },
  rain: { fontSize: 12, color: '#bfe3ff', width: 48 },
  tMin: { fontSize: 15, width: 32, textAlign: 'right' },
  tMax: { fontSize: 15, fontWeight: '700', width: 34, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, backgroundColor: '#ffd166' },
  outfitPreview: { fontSize: 13, marginTop: 8 },
  details: { marginTop: 12 },
  detailLine: { fontSize: 14, marginBottom: 6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 10 },
  trendNote: { fontSize: 13, fontStyle: 'italic', marginVertical: 8, textAlign: 'center' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 6 },
});
