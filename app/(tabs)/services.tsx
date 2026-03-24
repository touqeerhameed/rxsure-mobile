import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getServices } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Service } from '../../src/types';

export default function ServicesScreen() {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadServices = async () => {
    if (!organization) return;
    try {
      const result = await getServices(organization);
      const data = (result as any)?.services || (Array.isArray(result) ? result : []);
      setServices(data);
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
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={services}
      keyExtractor={(item) => item.name}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No services available</Text>
          <Text style={styles.emptyText}>Check back later for available consultations</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/service/${item.name}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            {item.description && (
              <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.metaRow}>
              {(item.duration_minutes || item.duration) ? (
                <View style={styles.metaItem}>
                  <Feather name="clock" size={13} color={COLORS.slate400} />
                  <Text style={styles.metaText}>{item.duration_minutes || item.duration} min</Text>
                </View>
              ) : null}
              {item.price != null && item.price > 0 ? (
                <Text style={styles.price}>{`£${Number(item.price).toFixed(2)}`}</Text>
              ) : (
                <Text style={styles.priceNHS}>NHS Free</Text>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.slate300} />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate700 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardContent: { flex: 1 },
  serviceName: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800, marginBottom: 4 },
  serviceDesc: { fontSize: FONT_SIZE.sm, color: COLORS.slate500, marginBottom: SPACING.sm, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  price: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.navy },
  priceNHS: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.green },
});
