import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getBookingDetails, cancelBooking } from '../../src/api/services';
import { formatDate, formatTime, getStatusColor, getStatusBgColor } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Booking } from '../../src/types';
import BottomNav from '../../src/components/BottomNav';

export default function BookingDetailScreen() {
  const { id, refresh } = useLocalSearchParams<{ id: string; refresh?: string }>();
  const router = useRouter();
  const { token, organization } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (id && token) {
      setLoading(true);
      getBookingDetails(token, id).then(setBooking).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, token, refresh]);

  const doCancel = async () => {
    setCancelling(true);
    setShowCancelModal(false);
    try {
      await cancelBooking(token!, id!, 'Cancelled by patient', organization);
      setCancelled(true);
      setBooking((prev) => prev ? { ...prev, status: 'Cancelled' } : prev);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert(err?.response?.data?.message || 'Failed to cancel');
      } else {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel');
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      setShowCancelModal(true);
    } else {
      Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!booking) {
    return <View style={styles.center}><Text>Booking not found</Text></View>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bDate = new Date(booking.booking_date);
  bDate.setHours(0, 0, 0, 0);
  const isUpcoming = bDate >= today && booking.status !== 'Cancelled';

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={[styles.statusBar, { backgroundColor: getStatusBgColor(booking.status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{booking.status}</Text>
      </View>

      {/* Service */}
      <Text style={styles.serviceName}>{booking.service_name}</Text>

      {/* Pharmacy */}
      <View style={styles.pharmacyCard}>
        <Feather name="home" size={18} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.pharmacyName}>{(booking as any).organization_name || 'RxSure Pharmacy'}</Text>
          {(booking as any).organization_address ? (
            <Text style={styles.pharmacyAddress}>{(booking as any).organization_address}</Text>
          ) : null}
          {(booking as any).organization_phone ? (
            <Text style={styles.pharmacyPhone}>{(booking as any).organization_phone}</Text>
          ) : null}
        </View>
      </View>

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
            <Feather name="user" size={18} color={COLORS.slate400} />
            <View>
              <Text style={styles.detailLabel}>Pharmacist</Text>
              <Text style={styles.detailValue}>{booking.pharmacist_name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Cancelled banner */}
      {cancelled && (
        <View style={{ backgroundColor: COLORS.greenBg, borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.green }}>
          <Text style={{ color: COLORS.green, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>Booking cancelled successfully</Text>
        </View>
      )}

      {/* Pre-Screening Questionnaire */}
      {isUpcoming && !cancelled && (booking as any).pre_screening_questionnaire && !(booking as any).prescreening_completed && !(booking as any).prescreening_completed_by_patient && (
        <TouchableOpacity
          style={styles.questionnaireBtn}
          onPress={() => router.push(`/questionnaire/${booking.name}`)}
          activeOpacity={0.7}
        >
          <Feather name="clipboard" size={18} color={COLORS.white} />
          <Text style={styles.questionnaireBtnText}>Complete Pre-Screening</Text>
        </TouchableOpacity>
      )}

      {/* Completed badge */}
      {((booking as any).prescreening_completed === 1 || (booking as any).prescreening_completed_by_patient === 1) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.greenBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, marginBottom: SPACING.md }}>
          <Feather name="check-circle" size={14} color={COLORS.green} />
          <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.green, fontWeight: '500' }}>Pre-screening completed</Text>
        </View>
      )}

      {/* Actions */}
      {isUpcoming && !cancelled && (
        <View style={{ gap: SPACING.md }}>
          <TouchableOpacity
            style={styles.rescheduleBtn}
            onPress={() => router.push({
              pathname: '/booking/select-time',
              params: {
                serviceId: booking.service,
                serviceName: booking.service_name,
                rescheduleId: booking.name,
                currentDate: booking.booking_date,
                currentTime: String(booking.booking_time).substring(0, 5),
              }
            })}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={18} color={COLORS.primary} />
            <Text style={styles.rescheduleText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling} activeOpacity={0.7}>
            {cancelling ? <ActivityIndicator size="small" color={COLORS.red} /> : <Feather name="x" size={18} color={COLORS.red} />}
            <Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel Booking'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel Confirmation Modal (web) */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl }}>
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xxl, width: '100%', maxWidth: 340 }}>
            <Feather name="alert-circle" size={32} color={COLORS.red} style={{ alignSelf: 'center', marginBottom: SPACING.md }} />
            <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.slate900, textAlign: 'center', marginBottom: SPACING.sm }}>Cancel Booking</Text>
            <Text style={{ fontSize: FONT_SIZE.base, color: COLORS.slate500, textAlign: 'center', marginBottom: SPACING.xxl }}>Are you sure you want to cancel this booking?</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.slate200, alignItems: 'center' }} onPress={() => setShowCancelModal(false)}>
                <Text style={{ fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate600 }}>No, Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.red, alignItems: 'center' }} onPress={doCancel}>
                <Text style={{ fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white }}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBar: { alignSelf: 'flex-start', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginBottom: SPACING.lg },
  statusText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  serviceName: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, marginBottom: SPACING.lg },
  pharmacyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  pharmacyName: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800 },
  pharmacyAddress: { fontSize: FONT_SIZE.sm, color: COLORS.slate500, marginTop: 2 },
  pharmacyPhone: { fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: 2 },
  detailCard: { backgroundColor: COLORS.slate50, borderRadius: RADIUS.md, padding: SPACING.lg, gap: SPACING.lg, marginBottom: SPACING.xxl },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  detailLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  detailValue: { fontSize: FONT_SIZE.base, fontWeight: '500', color: COLORS.slate800 },
  questionnaireBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, marginBottom: SPACING.md,
  },
  questionnaireBtnText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white },
  rescheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
  },
  rescheduleText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.primary },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: '#fca5a5', borderRadius: RADIUS.md, paddingVertical: 14,
  },
  cancelText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.red },
});
