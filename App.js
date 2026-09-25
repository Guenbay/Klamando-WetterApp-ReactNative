import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWeather } from './src/useWeather';
import { WeatherBackground } from './src/components/WeatherBackground';
import { TodayScreen } from './src/screens/TodayScreen';
import { ForecastScreen } from './src/screens/ForecastScreen';
import { PlacesScreen } from './src/screens/PlacesScreen';
import { describeWeather } from './src/logic/weatherCodes';
import { recommendOutfit } from './src/logic/outfit';
import { themeFor } from './src/logic/theme';
import { loadFavorites, saveFavorites } from './src/storage';

const TABS = [
  { key: 'today', label: 'Heute', icon: '👕' },
  { key: 'forecast', label: '7/14 Tage', icon: '📅' },
  { key: 'places', label: 'Orte', icon: '📍' },
];

const NEUTRAL_THEME = themeFor('partly', true, 15);

function todayOutfit(forecast) {
  const { current, today, hours, restOfToday } = forecast;
  const next12 = hours.slice(0, 12);
  return recommendOutfit({
    feels: current.feels,
    tempMin: today.tempMin,
    tempMax: today.tempMax,
    precipProb: Math.max(0, ...next12.map((h) => h.prob)),
    precipSum: next12.reduce((s, h) => s + h.precip, 0),
    wind: Math.max(current.wind, ...next12.map((h) => h.wind)),
    gusts: current.gusts,
    uv: Math.max(current.uv, ...restOfToday.map((h) => h.uv)),
    code: current.code,
  });
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Main() {
  const insets = useSafeAreaInsets();
  const weather = useWeather();
  const { place, forecast, loading, error, notice, offlineSince } = weather;
  const [tab, setTab] = useState('today');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites().then(setFavorites);
  }, []);

  const toggleFavorite = useCallback((p) => {
    setFavorites((list) => {
      const next = list.some((f) => f.id === p.id)
        ? list.filter((f) => f.id !== p.id)
        : [...list, { id: p.id, name: p.name, region: p.region, latitude: p.latitude, longitude: p.longitude }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const selectPlace = useCallback(
    (p) => {
      weather.selectPlace(p);
      setTab('today');
    },
    [weather]
  );

  const locate = useCallback(async () => {
    const ok = await weather.locateMe();
    if (ok) setTab('today');
  }, [weather]);

  const outfit = useMemo(() => (forecast ? todayOutfit(forecast) : null), [forecast]);
  const current = forecast ? forecast.current : null;
  const w = current ? describeWeather(current.code, current.isDay) : null;
  const theme = current ? themeFor(w.kind, current.isDay, current.temp) : NEUTRAL_THEME;

  let body;
  if (tab === 'places') {
    body = (
      <PlacesScreen
        theme={theme}
        place={place}
        favorites={favorites}
        onSelect={selectPlace}
        onToggleFavorite={toggleFavorite}
        onLocate={locate}
        notice={notice}
      />
    );
  } else if (!forecast) {
    body = (
      <View style={styles.center}>
        {error ? (
          <>
            <Text style={styles.bigIcon}>📡</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={weather.refresh} accessibilityRole="button">
              <Text style={styles.retryText}>Erneut versuchen</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Wetter wird geladen…</Text>
          </>
        )}
      </View>
    );
  } else if (tab === 'forecast') {
    body = <ForecastScreen theme={theme} forecast={forecast} loading={loading} onRefresh={weather.refresh} />;
  } else {
    body = (
      <TodayScreen
        theme={theme}
        forecast={forecast}
        outfit={outfit}
        loading={loading}
        onRefresh={weather.refresh}
      />
    );
  }

  return (
    <WeatherBackground
      theme={theme}
      kind={w ? w.kind : 'partly'}
      isDay={current ? current.isDay : true}
      emoji={w ? w.emoji : '⛅'}
      outfitEmojis={outfit ? outfit.items.map((i) => i.emoji) : []}
    >
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => setTab('places')} accessibilityRole="button" style={styles.headerPlace}>
          <Text style={styles.appName}>KLAMANDO</Text>
          <Text style={styles.placeName} numberOfLines={1}>
            {place ? `${place.isGps ? '📍 ' : ''}${place.name}` : 'Ort wird gesucht…'} ▾
          </Text>
        </Pressable>
        {loading && forecast ? <ActivityIndicator color="#fff" /> : null}
      </View>

      {offlineSince ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Offline – zeige gespeicherte Daten vom {formatTime(offlineSince)}</Text>
        </View>
      ) : null}
      {notice && tab !== 'places' ? (
        <Pressable style={styles.banner} onPress={weather.dismissNotice}>
          <Text style={styles.bannerText}>{notice} ✕</Text>
        </Pressable>
      ) : null}

      <View style={styles.body}>{body}</View>

      <View style={[styles.tabBar, { backgroundColor: theme.tabBar, paddingBottom: insets.bottom + 6 }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              style={styles.tab}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabIcon, !active && styles.inactive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, !active && styles.inactive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </WeatherBackground>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPlace: { flex: 1 },
  appName: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  placeName: { color: '#fff', fontSize: 24, fontWeight: '700' },
  banner: {
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    padding: 10,
  },
  bannerText: { color: '#fff', fontSize: 13 },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bigIcon: { fontSize: 56, marginBottom: 12 },
  errorText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 12 },
  retry: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: '#1d2b3a', fontWeight: '700', fontSize: 16 },
  tabBar: { flexDirection: 'row', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22 },
  tabLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 2 },
  inactive: { opacity: 0.5 },
});
