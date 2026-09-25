import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const NATIVE_DRIVER = Platform.OS !== 'web';

// Pseudozufall mit festem Seed, damit die Partikel beim Re-Render nicht springen
function seeded(i) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Particle({ index, width, height, kind }) {
  const progress = useRef(new Animated.Value(seeded(index + 7))).current;
  const snow = kind === 'snow';
  const duration = snow ? 7000 + seeded(index) * 5000 : 900 + seeded(index) * 700;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
      { resetBeforeIteration: true }
    );
    progress.setValue(0);
    const timer = setTimeout(() => anim.start(), seeded(index + 3) * duration);
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [progress, duration, index]);

  const left = seeded(index + 1) * width;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: snow ? [0, (seeded(index + 5) - 0.5) * 80] : [0, -30],
  });

  const style = snow
    ? { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)' }
    : { width: 2, height: 16, borderRadius: 1, backgroundColor: 'rgba(200,225,255,0.55)' };

  return (
    <Animated.View
      style={[styles.particle, style, { left, transform: [{ translateY }, { translateX }] }]}
    />
  );
}

function SunGlow() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 4000, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 4000, useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  return <Animated.View style={[styles.sun, { transform: [{ scale }] }]} />;
}

/**
 * Vollflächiger Hintergrund: Farbverlauf nach Wetter, animierter Regen/Schnee,
 * großes Wetter-Symbol und die empfohlenen Kleidungsstücke als "Bild" im Hintergrund.
 */
export function WeatherBackground({ theme, kind, isDay, emoji, outfitEmojis = [], children }) {
  const { width, height } = useWindowDimensions();
  const count = kind === 'snow' ? 40 : kind === 'rain' || kind === 'thunder' ? 55 : 0;
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  const decor = [...new Set(outfitEmojis)].slice(0, 5);

  return (
    <View style={styles.fill}>
      <LinearGradient colors={theme.colors} style={StyleSheet.absoluteFill} />
      {kind === 'clear' && isDay ? <SunGlow /> : null}
      <Text style={styles.bigEmoji} accessible={false}>
        {emoji}
      </Text>
      <View style={styles.decorRow} pointerEvents="none" accessible={false}>
        {decor.map((e, i) => (
          <Text
            key={e + i}
            style={[styles.decor, { transform: [{ rotate: `${(i % 2 ? 1 : -1) * (8 + i * 3)}deg` }] }]}
          >
            {e}
          </Text>
        ))}
      </View>
      {kind === 'thunder' ? <View style={styles.thunderTint} /> : null}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((i) => (
          <Particle key={`${kind}-${i}`} index={i} width={width} height={height} kind={kind === 'snow' ? 'snow' : 'rain'} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  particle: { position: 'absolute', top: 0 },
  sun: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,236,150,0.35)',
  },
  bigEmoji: {
    position: 'absolute',
    top: 70,
    right: -30,
    fontSize: 190,
    opacity: 0.22,
  },
  decorRow: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    opacity: 0.16,
  },
  decor: { fontSize: 64 },
  thunderTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(80,0,120,0.12)' },
});
