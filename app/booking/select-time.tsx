import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getAvailableSlots, createBooking, rescheduleBooking } from '../../src/api/services';
import { formatDate, formatTime } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { TimeSlot } from '../../src/types';
import BottomNav from '../../src/components/BottomNav';

export default function SelectTimeScreen() {
  const { serviceId, serviceName, rescheduleId, currentDate, currentTime } = useLocalSearchParams<{
    serviceId: string; serviceName: string; rescheduleId?: string; currentDate?: string; currentTime?: string;
  }>();
  const router = useRouter();
  const { token, organization, patient } = useAuthStore();
  const isReschedule = !!rescheduleId;

  const [selectedDate, setSelectedDate] = useState(
    currentDate ? new Date(currentDate) : new Date()
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const dateStr = selectedDate.toISOString().split('T')[0];

  const loadSlots = async () => {
    if (!serviceId || !organization) return;
    setLoading(true);
    setSelectedSlot(null);
    try {
      const data = await getAvailableSlots(serviceId!, dateStr, organization, token || undefined);
      setSlots(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlots(); }, [dateStr, serviceId]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate >= new Date(new Date().toDateString())) {
      setSelectedDate(newDate);
    }
  };

  const [booked, setBooked] = useState(false);
  const [bookError, setBookError] = useState('');

  const handleBook = async () => {
    if (!selectedSlot || !token) return;
    setBooking(true);
    setBookError('');
    try {
      let result: any;
      if (isReschedule) {
        result = await rescheduleBooking(token!, rescheduleId!, dateStr, selectedSlot, organization);
      } else {
        result = await createBooking({
          service_id: serviceId!,
          booking_date: dateStr,
          booking_time: selectedSlot,
          business_id: organization,
          patient_id: (patient as any)?.id || patient?.name,
          delivery_type: 'In Person',
        });
      }
      if ((result as any)?.success === false) {
        setBookError((result as any)?.error || (isReschedule ? 'Reschedule failed' : 'Booking failed'));
        setBooking(false);
        return;
      }
      setBooked(true);
    } catch (err: any) {
      const msg = err?.response?.data?._server_messages;
      let errorMsg = err?.response?.data?.message || 'Booking failed';
      if (msg) {
        try { errorMsg = JSON.parse(JSON.parse(msg)[0]).message; } catch {}
      }
      setBookError(errorMsg);
    } finally {
      setBooking(false);
    }
  };

  const availableSlots = slots.filter((s: any) => s.available !== false && s.is_available !== false);

  // Success screen
  if (booked) {
    return (
      <>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl }]}>
          <Feather name="check-circle" size={64} color={COLORS.primary} />
          <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, marginTop: SPACING.xl, textAlign: 'center' }}>
            {isReschedule ? 'Booking Rescheduled!' : 'Booking Confirmed!'}
          </Text>
          <Text style={{ fontSize: FONT_SIZE.base, color: COLORS.slate500, marginTop: SPACING.sm, textAlign: 'center' }}>
            {serviceName} on {formatDate(dateStr)} at {formatTime(selectedSlot!)}
          </Text>
          <TouchableOpacity
            style={[styles.bookBtn, { marginTop: SPACING.xxxl, width: '100%' }]}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.bookBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: SPACING.lg }}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={{ fontSize: FONT_SIZE.base, color: COLORS.blue, fontWeight: '500' }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </>
    );
  }

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Pharmacy */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
        <Feather name="home" size={13} color={COLORS.primary} />
        <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' }}>RxSure Pharmacy</Text>
      </View>

      <Text style={styles.serviceName}>{serviceName}</Text>

      {/* Current booking info for reschedule */}
      {isReschedule && currentDate && currentTime && (
        <View style={{ backgroundColor: COLORS.amberBg, borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.amber }}>
          <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.amber }}>Current booking</Text>
          <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.slate600, marginTop: 2 }}>
            {formatDate(currentDate)} at {formatTime(currentTime)}
          </Text>
          <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: 4 }}>Select a new date and time below</Text>
        </View>
      )}

      {/* Error */}
      {bookError ? (
        <View style={{ backgroundColor: COLORS.redBg, borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.red }}>
          <Text style={{ color: COLORS.red, fontSize: FONT_SIZE.sm }}>{bookError}</Text>
        </View>
      ) : null}

      {/* Date Picker */}
      <View style={styles.datePicker}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Feather name="chevron-left" size={20} color={COLORS.slate600} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDate(dateStr)}</Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Feather name="chevron-right" size={20} color={COLORS.slate600} />
        </TouchableOpacity>
      </View>

      {/* Slots */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.navy} style={{ marginTop: 40 }} />
      ) : availableSlots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No available slots</Text>
          <Text style={styles.emptyText}>Try another date</Text>
        </View>
      ) : (
        <View style={styles.slotsGrid}>
          {availableSlots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[styles.slotBtn, selectedSlot === slot.time && styles.slotSelected]}
              onPress={() => setSelectedSlot(slot.time)}
              activeOpacity={0.7}
            >
              <Text style={[styles.slotText, selectedSlot === slot.time && styles.slotTextSelected]}>
                {formatTime(slot.time)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Book Button */}
      {selectedSlot && (
        <TouchableOpacity
          style={[styles.bookBtn, booking && { opacity: 0.6 }]}
          onPress={handleBook}
          disabled={booking}
        >
          {booking ? <ActivityIndicator color={COLORS.white} /> : (
            <Text style={styles.bookBtnText}>{isReschedule ? 'Confirm Reschedule' : 'Confirm Booking'}</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
    <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl },
  serviceName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.slate800, marginBottom: SPACING.xxl },
  datePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.slate50, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xxl },
  dateArrow: { padding: SPACING.sm },
  dateText: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate800 },
  empty: { alignItems: 'center', paddingTop: 40, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate500 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  slotBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.slate200, backgroundColor: COLORS.white },
  slotSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.navy },
  slotText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate700 },
  slotTextSelected: { color: COLORS.white },
  bookBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.xxxl },
  bookBtnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
