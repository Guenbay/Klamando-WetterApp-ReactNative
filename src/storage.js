import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  place: 'klamando:place',
  favorites: 'klamando:favorites',
  cache: 'klamando:cache',
};

async function read(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function write(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speichern ist "nice to have" – App funktioniert auch ohne.
  }
}

export const loadPlace = () => read(KEYS.place, null);
export const savePlace = (place) => write(KEYS.place, place);

export const loadFavorites = () => read(KEYS.favorites, []);
export const saveFavorites = (list) => write(KEYS.favorites, list);

/** Letzte Vorhersage für Offline-Nutzung. */
export const loadCache = () => read(KEYS.cache, null);
export const saveCache = (place, raw) =>
  write(KEYS.cache, { place, raw, fetchedAt: Date.now() });
