import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';
import BottomNav from '../src/components/BottomNav';

const helpCards = [
  {
    icon: 'message-circle' as const,
    title: 'Contact Support',
    description: 'Have a question? Submit a support ticket',
    button: 'View Tickets',
    route: '/help/tickets',
  },
  {
    icon: 'shield' as const,
    title: 'Data Privacy (GDPR)',
    description: 'Exercise your data rights under GDPR',
    button: 'Manage Data',
    route: '/help/gdpr',
  },
  {
    icon: 'star' as const,
    title: 'Share Feedback',
    description: 'Help us improve by sharing your thoughts',
    button: 'Give Feedback',
    route: '/help/feedback',
  },
];

export default function HelpScreen() {
  const router = useRouter();

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Banner */}
        <View style={styles.banner}>
          <Feather name="help-circle" size={32} color={COLORS.white} />
          <Text style={styles.bannerTitle}>Help & Support</Text>
          <Text style={styles.bannerSubtitle}>
            How can we help you today?
          </Text>
        </View>

        {/* Help Cards */}
        {helpCards.map((card) => (
          <View key={card.title} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name={card.icon} size={22} color={COLORS.primary} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardButtonText}>{card.button}</Text>
              <Feather name="chevron-right" size={16} color={COLORS.white} />
            </TouchableOpacity>
            {card.title === 'Share Feedback' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/help/feedback-history' as any)}
                activeOpacity={0.7}
              >
                <Feather name="clock" size={14} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>View History</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { paddingBottom: 60 },
  banner: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xxl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  bannerSubtitle: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  cardDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate500,
    marginTop: 2,
  },
  cardButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  cardButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
