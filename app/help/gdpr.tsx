import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getMyGDPRRequests } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#dbeafe', text: '#2563eb' },
  IN_PROGRESS: { bg: COLORS.amberBg, text: COLORS.amber },
  COMPLETED: { bg: COLORS.greenBg, text: COLORS.green },
  REJECTED: { bg: COLORS.redBg, text: COLORS.red },
};

const TYPE_LABELS: Record<string, string> = {
  SAR: 'Subject Access Request',
  DATA_DELETION: 'Data Deletion',
  DATA_PORTABILITY: 'Data Portability',
  DATA_RECTIFICATION: 'Data Rectification',
  RIGHT_TO_OBJECT: 'Right to Object',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GDPRScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getMyGDPRRequests(token);
      const list = (result as any)?.requests || (Array.isArray(result) ? result : []);
      setRequests(list);
    } catch (e) {
      console.error('Failed to load GDPR requests:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Feather name="shield" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Under GDPR, you have the right to access, correct, delete, or export your personal data.
          </Text>
        </View>

        {/* New Request Button */}
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/help/submit-gdpr')}
          activeOpacity={0.7}
        >
          <Feather name="plus-circle" size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>New Request</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shield" size={48} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No data requests yet</Text>
            <Text style={styles.emptyDesc}>
              Submit a new request to exercise your data rights
            </Text>
          </View>
        ) : (
          requests.map((req: any) => {
            const statusStyle = STATUS_COLORS[req.status] || STATUS_COLORS.PENDING;
            return (
              <TouchableOpacity
                key={req.reference_number || req.name}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/help/gdpr/${req.name || req.reference_number}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.refNumber}>{req.reference_number || req.name}</Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                      {(req.status || 'PENDING').replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestType}>
                  {TYPE_LABELS[req.request_type] || req.request_type}
                </Text>
                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Feather name="calendar" size={12} color={COLORS.slate400} />
                    <Text style={styles.metaText}>{formatDate(req.creation || req.created_at)}</Text>
                  </View>
                  {req.deadline && (
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={12} color={COLORS.amber} />
                      <Text style={[styles.metaText, { color: COLORS.amber }]}>
                        Due: {formatDate(req.deadline)}
                      </Text>
                    </View>
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
  content: { padding: SPACING.lg, paddingBottom: 60 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 20,
  },
  newButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  newButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  refNumber: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  requestType: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.slate800,
    marginBottom: SPACING.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slate400,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.slate600,
    marginTop: SPACING.lg,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate400,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
