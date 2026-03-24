import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getAvailableSlots, createBooking } from '../../src/api/services';
import { formatDate, formatTime } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { TimeSlot } from '../../src/types';

export default function SelectTimeScreen() {
  const { serviceId, serviceName } = useLocalSearchParams<{ serviceId: string; serviceName: string }>();
  const router = useRouter();
  const { token, organization, patient } = useAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const handleBook = async () => {
    if (!selectedSlot || !token) return;
    setBooking(true);
    try {
      await createBooking({
        service_id: serviceId!,
        booking_date: dateStr,
        booking_time: selectedSlot,
        business_id: organization,
        patient_id: (patient as any)?.id || patient?.name,
        delivery_type: 'In Person',
      });
      Alert.alert('Booked!', `Your ${serviceName} appointment is confirmed for ${formatDate(dateStr)} at ${formatTime(selectedSlot)}`, [
        { text: 'View Bookings', onPress: () => router.replace('/(tabs)/bookings') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const availableSlots = slots.filter((s: any) => s.available !== false && s.is_available !== false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.serviceName}>{serviceName}</Text>

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
            <Text style={styles.bookBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
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
