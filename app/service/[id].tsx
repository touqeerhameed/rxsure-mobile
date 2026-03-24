import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getService } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Service } from '../../src/types';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { organization } = useAuthStore();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && organization) {
      getService(id, organization).then((result: any) => {
        const svc = result?.service || result;
        setService(svc);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, organization]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  if (!service) {
    return <View style={styles.center}><Text>Service not found</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{service.service_name}</Text>

      <View style={styles.metaRow}>
        {(service.duration_minutes || service.duration) && (
          <View style={styles.metaChip}>
            <Feather name="clock" size={14} color={COLORS.slate500} />
            <Text style={styles.metaText}>{service.duration_minutes || service.duration} minutes</Text>
          </View>
        )}
        {service.service_delivery && (
          <View style={styles.metaChip}>
            <Feather name="video" size={14} color={COLORS.slate500} />
            <Text style={styles.metaText}>{service.service_delivery}</Text>
          </View>
        )}
        {service.price != null && service.price > 0 ? (
          <View style={styles.metaChip}>
            <Text style={styles.priceText}>£{Number(service.price).toFixed(2)}</Text>
          </View>
        ) : (
          <View style={[styles.metaChip, { backgroundColor: COLORS.greenBg }]}>
            <Text style={[styles.priceText, { color: COLORS.green }]}>NHS Free</Text>
          </View>
        )}
      </View>

      {service.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push({ pathname: '/booking/select-time', params: { serviceId: service.name, serviceName: service.service_name } })}
        activeOpacity={0.8}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
        <Feather name="chevron-right" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, marginBottom: SPACING.md },
  metaRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.slate100, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  metaText: { fontSize: FONT_SIZE.sm, color: COLORS.slate500 },
  priceText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.navy },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate800, marginBottom: SPACING.sm },
  description: { fontSize: FONT_SIZE.base, color: COLORS.slate600, lineHeight: 22 },
  bookButton: {
    backgroundColor: COLORS.navy, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  bookButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
