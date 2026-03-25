import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getMyTickets } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: '#dbeafe', text: '#2563eb' },
  IN_PROGRESS: { bg: COLORS.amberBg, text: COLORS.amber },
  RESOLVED: { bg: COLORS.greenBg, text: COLORS.green },
  CLOSED: { bg: COLORS.slate100, text: COLORS.slate500 },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TicketsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getMyTickets(token);
      const list = (result as any)?.tickets || (Array.isArray(result) ? result : []);
      setTickets(list);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadTickets();
  }, [loadTickets]));

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: tickets.length, color: COLORS.primary },
            { label: 'Open', value: tickets.filter((t: any) => t.status === 'NEW' || t.status === 'IN_PROGRESS' || t.status === 'WAITING').length, color: '#2563eb' },
            { label: 'Resolved', value: tickets.filter((t: any) => t.status === 'RESOLVED').length, color: COLORS.green },
            { label: 'Closed', value: tickets.filter((t: any) => t.status === 'CLOSED').length, color: COLORS.slate500 },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* New Ticket Button */}
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/help/submit-ticket')}
          activeOpacity={0.7}
        >
          <Feather name="plus-circle" size={18} color={COLORS.white} />
          <Text style={styles.newButtonText}>New Ticket</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No support tickets yet</Text>
            <Text style={styles.emptyDesc}>
              Submit a new ticket if you need help
            </Text>
          </View>
        ) : (
          tickets.map((ticket: any) => {
            const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.NEW;
            return (
              <TouchableOpacity
                key={ticket.ticket_id || ticket.name}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/help/ticket/${ticket.name || ticket.ticket_id}` as any)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.ticketId}>{ticket.ticket_id || ticket.name}</Text>
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                      {(ticket.status || 'NEW').replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.subject} numberOfLines={2}>{ticket.subject}</Text>
                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <Feather name="tag" size={12} color={COLORS.slate400} />
                    <Text style={styles.metaText}>{ticket.category || 'General'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Feather name="clock" size={12} color={COLORS.slate400} />
                    <Text style={styles.metaText}>{formatDate(ticket.creation || ticket.created_at)}</Text>
                  </View>
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
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: 2 },
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
  ticketId: {
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
  subject: {
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
  },
});
