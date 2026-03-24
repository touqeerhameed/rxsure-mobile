import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getPatientBookings } from '../../src/api/services';
import { formatDate, formatTime, getStatusColor, getStatusBgColor } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Booking } from '../../src/types';

export default function BookingsScreen() {
  const router = useRouter();
  const { token, organization, patient } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const loadBookings = async () => {
    if (!token || !organization) return;
    try {
      const patientId = (patient as any)?.id || patient?.name;
      const data = await getPatientBookings(token, organization, patientId);
      setBookings(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [token, organization]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const now = new Date();
  const filtered = bookings.filter((b) => {
    const bDate = new Date(b.booking_date);
    if (tab === 'upcoming') return bDate >= now && b.status !== 'Cancelled';
    return bDate < now || b.status === 'Cancelled';
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'past' && styles.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item) => item.name}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={14} color={COLORS.slate400} />
            <Text style={styles.emptyTitle}>No {tab} bookings</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/booking/${item.name}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTop}>
              <Text style={styles.serviceName}>{item.service_name}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusBgColor(item.status) }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.details}>
              <View style={styles.detail}>
                <Feather name="calendar" size={14} color={COLORS.slate400} />
                <Text style={styles.detailText}>{formatDate(item.booking_date)}</Text>
              </View>
              <View style={styles.detail}>
                <Feather name="clock" size={14} color={COLORS.slate400} />
                <Text style={styles.detailText}>{formatTime(item.booking_time)}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.slate300} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', padding: SPACING.lg, gap: SPACING.sm },
  tabBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderRadius: RADIUS.sm, backgroundColor: COLORS.white },
  tabActive: { backgroundColor: COLORS.navy },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate500 },
  tabTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: 0 },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate500 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.md, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  serviceName: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800, flex: 1, marginRight: SPACING.sm },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: 3, borderRadius: RADIUS.sm },
  badgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  details: { flexDirection: 'row', gap: SPACING.xl },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: FONT_SIZE.sm, color: COLORS.slate500 },
});
