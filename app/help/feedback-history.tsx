import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getFeedbackHistory } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import PrivateImage from '../../src/components/PrivateImage';
import BottomNav from '../../src/components/BottomNav';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const RATING_COLORS: Record<number, string> = {
  1: COLORS.red,
  2: '#ea580c',
  3: COLORS.amber,
  4: COLORS.green,
  5: COLORS.primary,
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function FeedbackHistoryScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadFeedback = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getFeedbackHistory(token);
      const list = (result as any)?.feedback || (Array.isArray(result) ? result : []);
      setFeedback(list);
    } catch (e) {
      console.error('Failed to load feedback:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedback();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name="star"
            size={14}
            color={star <= rating ? '#f59e0b' : COLORS.slate200}
            style={star <= rating ? { } : undefined}
          />
        ))}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Give Feedback button */}
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/help/feedback')}
          activeOpacity={0.7}
        >
          <Feather name="plus-circle" size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>Give Feedback</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : feedback.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-square" size={48} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No feedback submitted yet</Text>
            <Text style={styles.emptyDesc}>
              Share your thoughts to help us improve!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/help/feedback')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyButtonText}>Give Feedback</Text>
            </TouchableOpacity>
          </View>
        ) : (
          feedback.map((item: any) => {
            const isExpanded = expandedId === (item.name || item.feedback_id);
            const ratingColor = RATING_COLORS[item.rating] || COLORS.slate500;

            return (
              <TouchableOpacity
                key={item.name || item.feedback_id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => toggleExpand(item.name || item.feedback_id)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.ratingSection}>
                    {renderStars(item.rating)}
                    <Text style={[styles.ratingLabel, { color: ratingColor }]}>
                      {RATING_LABELS[item.rating] || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.cardMeta}>
                    {item.is_reviewed && (
                      <View style={styles.reviewedBadge}>
                        <Text style={styles.reviewedText}>Reviewed</Text>
                      </View>
                    )}
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.slate400}
                    />
                  </View>
                </View>

                <Text
                  style={styles.feedbackText}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {item.feedback_text}
                </Text>

                {/* Attachments */}
                {item.attachments && item.attachments.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm }}>
                    {item.attachments.map((att: any, i: number) => (
                      <PrivateImage
                        key={i}
                        fileUrl={att.file_url || ''}
                        fileName={att.file_name}
                        style={{ width: 60, height: 60 }}
                      />
                    ))}
                  </View>
                )}

                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Feather name="clock" size={12} color={COLORS.slate400} />
                    <Text style={styles.metaText}>{formatDate(item.creation)}</Text>
                  </View>
                  {item.contact_consent && (
                    <Text style={styles.consentText}>Follow-up agreed</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  newButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  newButtonText: {
    fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white,
  },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  ratingSection: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  starsRow: {
    flexDirection: 'row', gap: 2,
  },
  ratingLabel: {
    fontSize: FONT_SIZE.sm, fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  reviewedBadge: {
    backgroundColor: COLORS.greenBg, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  reviewedText: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.green,
  },

  feedbackText: {
    fontSize: FONT_SIZE.base, color: COLORS.slate600, lineHeight: 22,
    marginBottom: SPACING.md,
  },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400,
  },
  consentText: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, fontStyle: 'italic',
  },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate600,
    marginTop: SPACING.lg,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate400,
    marginTop: SPACING.xs, textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  emptyButtonText: {
    fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white,
  },
});
