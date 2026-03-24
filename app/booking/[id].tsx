import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getBookingDetails, cancelBooking } from '../../src/api/services';
import { formatDate, formatTime, getStatusColor, getStatusBgColor } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Booking } from '../../src/types';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && token) {
      getBookingDetails(token, id).then(setBooking).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, token]);

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(token!, id!);
            Alert.alert('Cancelled', 'Your booking has been cancelled');
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  if (!booking) {
    return <View style={styles.center}><Text>Booking not found</Text></View>;
  }

  const isUpcoming = new Date(booking.booking_date) >= new Date() && booking.status !== 'Cancelled';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={[styles.statusBar, { backgroundColor: getStatusBgColor(booking.status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{booking.status}</Text>
      </View>

      {/* Service */}
      <Text style={styles.serviceName}>{booking.service_name}</Text>

      {/* Details */}
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={18} color={COLORS.slate400} />
          <View>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.booking_date)}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Feather name="clock" size={18} color={COLORS.slate400} />
          <View>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(booking.booking_time)}</Text>
          </View>
        </View>
        {booking.delivery_type && (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={18} color={COLORS.slate400} />
            <View>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{booking.delivery_type}</Text>
            </View>
          </View>
        )}
        {booking.pharmacist_name && (
          <View style={styles.detailRow}>
            <Feather name="phone" size={18} color={COLORS.slate400} />
            <View>
              <Text style={styles.detailLabel}>Pharmacist</Text>
              <Text style={styles.detailValue}>{booking.pharmacist_name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      {isUpcoming && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
          <Feather name="x" size={18} color={COLORS.red} />
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBar: { alignSelf: 'flex-start', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginBottom: SPACING.lg },
  statusText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  serviceName: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, marginBottom: SPACING.xxl },
  detailCard: { backgroundColor: COLORS.slate50, borderRadius: RADIUS.md, padding: SPACING.lg, gap: SPACING.lg, marginBottom: SPACING.xxl },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  detailLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  detailValue: { fontSize: FONT_SIZE.base, fontWeight: '500', color: COLORS.slate800 },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: '#fca5a5', borderRadius: RADIUS.md, paddingVertical: 14,
  },
  cancelText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.red },
});
