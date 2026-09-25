import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, SectionTitle } from '../components/ui';
import { searchPlaces } from '../api/openMeteo';

function PlaceRow({ theme, place, active, isFavorite, onSelect, onToggleFavorite }) {
  return (
    <View style={styles.placeRow}>
      <Pressable style={styles.placeMain} onPress={() => onSelect(place)} accessibilityRole="button">
        <Text style={[styles.placeName, { color: theme.text }]}>
          {active ? '📍 ' : ''}
          {place.name}
        </Text>
        {place.region ? (
          <Text style={[styles.placeRegion, { color: theme.textDim }]}>{place.region}</Text>
        ) : null}
      </Pressable>
      {onToggleFavorite ? (
        <Pressable
          onPress={() => onToggleFavorite(place)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Favorit entfernen' : 'Als Favorit speichern'}
        >
          <Text style={styles.star}>{isFavorite ? '⭐' : '☆'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PlacesScreen({ theme, place, favorites, onSelect, onToggleFavorite, onLocate, notice }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Suche mit kurzer Verzögerung, damit nicht bei jedem Tastendruck angefragt wird
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchPlaces(query);
        if (!cancelled) {
          setResults(r);
          setSearchError(r.length === 0 ? 'Kein Ort gefunden.' : null);
        }
      } catch {
        if (!cancelled) setSearchError('Suche fehlgeschlagen – bist du online?');
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const isFav = (p) => favorites.some((f) => f.id === p.id);
  const choose = (p) => {
    Keyboard.dismiss();
    setQuery('');
    onSelect(p);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.input}
        placeholder="Stadt oder Ort suchen…"
        placeholderTextColor="#6b7a89"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {query.trim().length >= 2 ? (
        <Card theme={theme} strong>
          <SectionTitle theme={theme}>Suchergebnisse</SectionTitle>
          {searching ? <ActivityIndicator color="#fff" /> : null}
          {searchError && !searching ? (
            <Text style={{ color: theme.textDim }}>{searchError}</Text>
          ) : null}
          {results.map((p) => (
            <PlaceRow
              key={p.id}
              theme={theme}
              place={p}
              isFavorite={isFav(p)}
              onSelect={choose}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </Card>
      ) : null}

      <Pressable
        style={[styles.gpsBtn, { backgroundColor: theme.cardStrong }]}
        onPress={onLocate}
        accessibilityRole="button"
      >
        <Text style={styles.gpsText}>📍 Aktuellen Standort verwenden</Text>
      </Pressable>
      {notice ? <Text style={[styles.notice, { color: theme.text }]}>⚠️ {notice}</Text> : null}

      {place ? (
        <Card theme={theme}>
          <SectionTitle theme={theme}>Aktueller Ort</SectionTitle>
          <PlaceRow
            theme={theme}
            place={place}
            active
            isFavorite={isFav(place)}
            onSelect={choose}
            onToggleFavorite={place.isGps ? null : onToggleFavorite}
          />
        </Card>
      ) : null}

      <Card theme={theme}>
        <SectionTitle theme={theme}>Favoriten</SectionTitle>
        {favorites.length === 0 ? (
          <Text style={{ color: theme.textDim }}>
            Noch keine Favoriten. Suche einen Ort und tippe auf ☆.
          </Text>
        ) : (
          favorites.map((p) => (
            <PlaceRow
              key={p.id}
              theme={theme}
              place={p}
              active={place && place.id === p.id}
              isFavorite
              onSelect={choose}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1d2b3a',
    marginBottom: 14,
  },
  gpsBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  gpsText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  notice: { fontSize: 14, marginBottom: 14, lineHeight: 20 },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  placeMain: { flex: 1 },
  placeName: { fontSize: 17, fontWeight: '600' },
  placeRegion: { fontSize: 13, marginTop: 2 },
  star: { fontSize: 24, color: '#ffd166', paddingLeft: 12 },
});
