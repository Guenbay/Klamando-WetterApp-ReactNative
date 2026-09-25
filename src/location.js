import { Platform } from 'react-native';
import * as Location from 'expo-location';

export const DEFAULT_PLACE = {
  id: 'default-berlin',
  name: 'Berlin',
  region: 'Deutschland',
  latitude: 52.52,
  longitude: 13.405,
};

/**
 * Ermittelt den aktuellen Standort per GPS.
 * Wirft einen Fehler mit verständlicher Nachricht, wenn das nicht klappt.
 */
export async function getCurrentPlace() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Standortzugriff wurde nicht erlaubt.');
  }

  let pos = null;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    pos = await Location.getLastKnownPositionAsync();
  }
  if (!pos) throw new Error('Standort konnte nicht ermittelt werden.');

  const { latitude, longitude } = pos.coords;
  let name = 'Mein Standort';
  let region = '';

  if (Platform.OS !== 'web') {
    try {
      const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addr) {
        name = addr.city || addr.subregion || addr.district || addr.name || name;
        region = [addr.region, addr.country].filter(Boolean).join(', ');
      }
    } catch {
      // Ortsname ist optional
    }
  }

  return { id: 'gps', name, region, latitude, longitude, isGps: true };
}
