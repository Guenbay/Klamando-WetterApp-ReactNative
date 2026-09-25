import { StyleSheet, Text, View } from 'react-native';

export function Card({ theme, style, children, strong }) {
  return (
    <View style={[styles.card, { backgroundColor: strong ? theme.cardStrong : theme.card }, style]}>
      {children}
    </View>
  );
}

export function SectionTitle({ theme, children }) {
  return <Text style={[styles.section, { color: theme.textDim }]}>{children}</Text>;
}

export function OutfitList({ theme, outfit, compact }) {
  return (
    <View>
      <View style={styles.outfitGrid}>
        {outfit.items.map((item) => (
          <View key={item.label} style={[styles.outfitItem, compact && styles.outfitItemCompact]}>
            <Text style={compact ? styles.outfitEmojiSmall : styles.outfitEmoji}>{item.emoji}</Text>
            <Text style={[styles.outfitLabel, { color: theme.text }]} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
      {outfit.tips.map((tip) => (
        <Text key={tip} style={[styles.tip, { color: theme.text }]}>
          💡 {tip}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  outfitItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  outfitItemCompact: { marginBottom: 8 },
  outfitEmoji: { fontSize: 40, marginBottom: 4 },
  outfitEmojiSmall: { fontSize: 28, marginBottom: 2 },
  outfitLabel: { fontSize: 12, textAlign: 'center', fontWeight: '600' },
  tip: { fontSize: 14, lineHeight: 20, marginTop: 4 },
});
