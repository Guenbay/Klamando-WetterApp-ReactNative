import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchForecast } from './api/openMeteo';
import { normalizeForecast } from './logic/forecast';
import { DEFAULT_PLACE, getCurrentPlace } from './location';
import { loadCache, loadPlace, saveCache, savePlace } from './storage';

function samePlace(a, b) {
  return (
    a && b &&
    Math.abs(a.latitude - b.latitude) < 0.01 &&
    Math.abs(a.longitude - b.longitude) < 0.01
  );
}

/**
 * Zentraler Zustand: gewählter Ort + Vorhersage inkl. Offline-Cache.
 */
export function useWeather() {
  const [place, setPlace] = useState(null);
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [offlineSince, setOfflineSince] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async (target) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const cache = await loadCache();
    const cacheHit = cache && samePlace(cache.place, target) ? cache : null;
    if (cacheHit) setRaw(cacheHit.raw);

    try {
      const data = await fetchForecast(target.latitude, target.longitude);
      if (id !== requestId.current) return;
      setRaw(data);
      setOfflineSince(null);
      saveCache(target, data);
    } catch (e) {
      if (id !== requestId.current) return;
      if (cacheHit) {
        setOfflineSince(cacheHit.fetchedAt);
      } else {
        setRaw(null);
        setError(
          'Wetterdaten konnten nicht geladen werden. Bitte Internetverbindung prüfen.' +
            (e && e.message ? `\n(${e.message})` : '')
        );
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const selectPlace = useCallback(
    (p) => {
      setPlace(p);
      savePlace(p);
      setNotice(null);
      load(p);
    },
    [load]
  );

  const locateMe = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getCurrentPlace();
      selectPlace(p);
      return true;
    } catch (e) {
      setNotice(e.message);
      setLoading(false);
      return false;
    }
  }, [selectPlace]);

  const refresh = useCallback(() => {
    if (place) load(place);
  }, [place, load]);

  // Start: gespeicherter Ort → GPS → Berlin als Fallback
  useEffect(() => {
    (async () => {
      const saved = await loadPlace();
      if (saved) {
        setPlace(saved);
        load(saved);
        return;
      }
      try {
        const p = await getCurrentPlace();
        selectPlace(p);
      } catch (e) {
        setPlace(DEFAULT_PLACE);
        setNotice(`${e.message} Zeige Berlin – suche deinen Ort unter „Orte“.`);
        load(DEFAULT_PLACE);
      }
    })();
  }, [load, selectPlace]);

  const forecast = useMemo(() => {
    if (!raw) return null;
    try {
      return normalizeForecast(raw);
    } catch {
      return null;
    }
  }, [raw]);

  return {
    place,
    forecast,
    loading,
    error,
    notice,
    offlineSince,
    selectPlace,
    locateMe,
    refresh,
    dismissNotice: () => setNotice(null),
  };
}
