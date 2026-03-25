import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getServices } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Service } from '../../src/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://devai.neoron.co.uk';

export default function ServicesScreen() {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [freeConsultationText, setFreeConsultationText] = useState('');
  const [showPrice, setShowPrice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = async () => {
    if (!organization) return;
    try {
      const result = await getServices(organization);
      const data = (result as any)?.services || (Array.isArray(result) ? result : []);
      setServices(data);
      setFreeConsultationText((result as any)?.free_consultation_text || '');
      setShowPrice(!!(result as any)?.show_service_price);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, [organization]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={services}
      keyExtractor={(item) => item.name}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      ListHeaderComponent={
        <View style={styles.pharmacyBanner}>
          <Feather name="home" size={14} color={COLORS.primary} />
          <Text style={styles.pharmacyBannerText}>RxSure Pharmacy</Text>
          <Text style={styles.serviceCount}>{services.length} services</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No services available</Text>
          <Text style={styles.emptyText}>Check back later for available consultations</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isFree = !!(item as any).is_free;
        const isNHS = !!(item as any).nhs_service;
        const duration = (item as any).duration_minutes || item.duration;
        const delivery = (item as any).service_delivery;

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/service/${item.name}`)}
            activeOpacity={0.7}
          >
            {/* Service Image */}
            {item.image ? (
              <Image
                source={{ uri: `${API_URL}${item.image}` }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.serviceImagePlaceholder}>
                <Feather name="clipboard" size={20} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.cardContent}>
              {/* Service Name + NHS badge */}
              <View style={styles.nameRow}>
                <Text style={styles.serviceName} numberOfLines={2}>{item.service_name}</Text>
                {isNHS && (
                  <View style={styles.nhsBadge}>
                    <Text style={styles.nhsText}>NHS</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {item.description && (
                <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
              )}

              {/* Meta row: duration + delivery type */}
              <View style={styles.metaRow}>
                {duration ? (
                  <View style={styles.metaChip}>
                    <Feather name="clock" size={12} color={COLORS.primary} />
                    <Text style={styles.metaChipText}>{duration} min</Text>
                  </View>
                ) : null}
                {delivery ? (
                  <View style={styles.metaChip}>
                    <Feather name="video" size={12} color={COLORS.primary} />
                    <Text style={styles.metaChipText}>{delivery}</Text>
                  </View>
                ) : null}
              </View>

              {/* Price / Free label */}
              {isFree && freeConsultationText ? (
                <View style={styles.freeChip}>
                  <Feather name="phone" size={13} color={COLORS.primary} />
                  <Text style={styles.freeChipText}>{freeConsultationText}</Text>
                </View>
              ) : !isFree && showPrice ? (
                <Text style={styles.price}>{`FROM £${Number(item.price || 0).toFixed(2)}`}</Text>
              ) : null}
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.slate300} />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg },
  pharmacyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  pharmacyBannerText: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary, flex: 1 },
  serviceCount: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate700 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    marginBottom: SPACING.md, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
  },
  serviceImage: { width: 56, height: 56, borderRadius: RADIUS.sm, marginRight: SPACING.md },
  serviceImagePlaceholder: {
    width: 56, height: 56, borderRadius: RADIUS.sm, marginRight: SPACING.md,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 4 },
  serviceName: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800, flex: 1 },
  nhsBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  nhsText: { fontSize: 9, fontWeight: '700', color: '#1d4ed8' },
  serviceDesc: { fontSize: FONT_SIZE.sm, color: COLORS.slate500, marginBottom: SPACING.sm, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  metaChipText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '500' },
  freeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  freeChipText: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.primary },
  price: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.primary },
  nhsFree: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.green },
});
