import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, OutfitList, SectionTitle } from '../components/ui';
import { describeWeather } from '../logic/weatherCodes';
import { buildInsights, clockOf } from '../logic/forecast';

function Stat({ theme, label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textDim }]}>{label}</Text>
    </View>
  );
}

function uvLabel(uv) {
  if (uv < 3) return 'niedrig';
  if (uv < 6) return 'mittel';
  if (uv < 8) return 'hoch';
  return 'sehr hoch';
}

export function TodayScreen({ theme, forecast, outfit, loading, onRefresh }) {
  const { current, today, hours } = forecast;
  const w = describeWeather(current.code, current.isDay);
  const insights = buildInsights(forecast);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.hero}>
        <Text style={[styles.temp, { color: theme.text }]}>{Math.round(current.temp)}°</Text>
        <Text style={[styles.condition, { color: theme.text }]}>
          {w.emoji} {w.label}
        </Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>
          Gefühlt {Math.round(current.feels)}° · ↑ {Math.round(today.tempMax)}° ↓ {Math.round(today.tempMin)}°
        </Text>
      </View>

      <Card theme={theme} strong>
        <SectionTitle theme={theme}>Was ziehe ich an?</SectionTitle>
        <Text style={[styles.headline, { color: theme.accent }]}>{outfit.headline}</Text>
        <OutfitList theme={theme} outfit={outfit} />
      </Card>

      {insights.length > 0 ? (
        <Card theme={theme}>
          <SectionTitle theme={theme}>Gut zu wissen</SectionTitle>
          {insights.map((i) => (
            <View key={i.text} style={styles.insight}>
              <Text style={styles.insightIcon}>{i.icon}</Text>
              <Text style={[styles.insightText, { color: theme.text }]}>{i.text}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card theme={theme}>
        <SectionTitle theme={theme}>Nächste 24 Stunden</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {hours.map((h, idx) => {
            const hw = describeWeather(h.code, h.isDay);
            return (
              <View key={h.time} style={styles.hour}>
                <Text style={[styles.hourTime, { color: theme.textDim }]}>
                  {idx === 0 ? 'Jetzt' : `${h.hour} Uhr`}
                </Text>
                <Text style={styles.hourEmoji}>{hw.emoji}</Text>
                <Text style={[styles.hourTemp, { color: theme.text }]}>{Math.round(h.temp)}°</Text>
                <Text style={[styles.hourRain, { opacity: h.prob >= 10 ? 1 : 0.35 }]}>
                  💧{Math.round(h.prob)}%
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Card>

      <Card theme={theme}>
        <SectionTitle theme={theme}>Details</SectionTitle>
        <View style={styles.stats}>
          <Stat theme={theme} label="Wind" value={`${Math.round(current.wind)} km/h`} />
          <Stat theme={theme} label="Böen" value={`${Math.round(current.gusts)} km/h`} />
          <Stat theme={theme} label="Luftfeuchte" value={`${Math.round(current.humidity)} %`} />
          <Stat theme={theme} label={`UV (${uvLabel(today.uvMax)})`} value={`${Math.round(today.uvMax)}`} />
          <Stat theme={theme} label="Regen heute" value={`${today.precipSum.toFixed(1)} mm`} />
          <Stat theme={theme} label="Regenrisiko" value={`${Math.round(today.precipProb)} %`} />
          <Stat theme={theme} label="Sonnenaufgang" value={clockOf(today.sunrise)} />
          <Stat theme={theme} label="Sonnenuntergang" value={clockOf(today.sunset)} />
        </View>
      </Card>

      <Text style={[styles.source, { color: theme.textDim }]}>
        Wetterdaten: Open-Meteo.com (CC BY 4.0) · Stand {clockOf(current.time)} Uhr Ortszeit
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  temp: { fontSize: 96, fontWeight: '200', lineHeight: 104 },
  condition: { fontSize: 22, fontWeight: '600' },
  sub: { fontSize: 15, marginTop: 6 },
  headline: { fontSize: 20, fontWeight: '700', marginBottom: 14 },
  insight: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  insightIcon: { fontSize: 20, width: 32 },
  insightText: { flex: 1, fontSize: 15, lineHeight: 21 },
  hour: { alignItems: 'center', width: 62 },
  hourTime: { fontSize: 12, marginBottom: 6 },
  hourEmoji: { fontSize: 24, marginBottom: 6 },
  hourTemp: { fontSize: 17, fontWeight: '600' },
  hourRain: { fontSize: 11, color: '#bfe3ff', marginTop: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  stat: { width: '50%', marginBottom: 14 },
  statValue: { fontSize: 18, fontWeight: '600' },
  statLabel: { fontSize: 12, marginTop: 2 },
  source: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
