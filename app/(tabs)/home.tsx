import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getPatientBookings } from '../../src/api/services';
import { formatPatientName, formatDate, formatTime, getStatusColor, getStatusBgColor } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Booking } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { patient, token, organization } = useAuthStore();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    if (!token || !organization) return;
    try {
      const patientId = (patient as any)?.id || patient?.name;
      const bookingsList = await getPatientBookings(token, organization, patientId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = (bookingsList)
        .filter((b: Booking) => {
          const bDate = new Date(b.booking_date);
          bDate.setHours(0, 0, 0, 0);
          return b.status !== 'Cancelled' && bDate >= today;
        })
        .sort((a: Booking, b: Booking) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
        .slice(0, 3);
      setUpcomingBookings(upcoming);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => { loadBookings(); }, [token, organization])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
    >
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Hello,</Text>
        <Text style={styles.welcomeName}>
          {formatPatientName(patient?.first_name, null, patient?.last_name)}
        </Text>
        <Text style={styles.welcomeSub}>Manage your pharmacy consultations</Text>
        {organization && (
          <View style={styles.pharmacyBadge}>
            <Feather name="home" size={12} color={COLORS.primaryLight} />
            <Text style={styles.pharmacyBadgeText}>RxSure Pharmacy</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/services')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#eff6ff' }]}>
            <Feather name="plus" size={20} color={COLORS.blue} />
          </View>
          <Text style={styles.quickText}>Book New</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/bookings')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#f0fdf4' }]}>
            <Feather name="calendar" size={14} color={COLORS.slate400} />
          </View>
          <Text style={styles.quickText}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {upcomingBookings.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {upcomingBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="calendar" size={14} color={COLORS.slate400} />
          <Text style={styles.emptyTitle}>No upcoming appointments</Text>
          <Text style={styles.emptyText}>Book a consultation to get started</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/services')}
          >
            <Text style={styles.emptyButtonText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        upcomingBookings.map((booking) => (
          <TouchableOpacity
            key={booking.name}
            style={styles.bookingCard}
            onPress={() => router.push(`/booking/${booking.name}`)}
            activeOpacity={0.7}
          >
            <View style={styles.bookingTop}>
              <Text style={styles.bookingService}>{booking.service_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(booking.status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status}
                </Text>
              </View>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.bookingDetail}>
                <Feather name="calendar" size={14} color={COLORS.slate400} />
                <Text style={styles.bookingDetailText}>{formatDate(booking.booking_date)}</Text>
              </View>
              <View style={styles.bookingDetail}>
                <Feather name="clock" size={14} color={COLORS.slate400} />
                <Text style={styles.bookingDetailText}>{formatTime(booking.booking_time)}</Text>
              </View>
            </View>
            {/* Pre-screening indicator */}
            {(booking as any).pre_screening_questionnaire ? (
              (booking as any).prescreening_completed || (booking as any).prescreening_completed_by_patient ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm }}>
                  <Feather name="check-circle" size={12} color={COLORS.green} />
                  <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.green }}>Pre-screening done</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.sm }}>
                  <Feather name="clipboard" size={12} color={COLORS.amber} />
                  <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.amber }}>Pre-screening required</Text>
                </View>
              )
            ) : null}
            <Feather name="chevron-right" size={18} color={COLORS.slate300} style={styles.chevron} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg },
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  pharmacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pharmacyBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  welcomeText: { fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.7)' },
  welcomeName: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.white, marginTop: 2 },
  welcomeSub: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.5)', marginTop: SPACING.sm },
  quickActions: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  quickAction: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate700 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.slate900 },
  seeAll: { fontSize: FONT_SIZE.sm, color: COLORS.blue, fontWeight: '500' },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.xxxl,
    alignItems: 'center', gap: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate700 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  emptyButton: { backgroundColor: COLORS.navy, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, marginTop: SPACING.sm },
  emptyButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm },
  bookingCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.md, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  bookingService: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800, flex: 1, marginRight: SPACING.sm },
  statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: 3, borderRadius: RADIUS.sm },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  bookingDetails: { flexDirection: 'row', gap: SPACING.xl },
  bookingDetail: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  bookingDetailText: { fontSize: FONT_SIZE.sm, color: COLORS.slate500 },
  chevron: { position: 'absolute', right: SPACING.lg, top: '50%' },
});
