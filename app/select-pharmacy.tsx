import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getPharmacyList } from '../src/api/services';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gphc_number?: string;
  regulatory_body_label?: string;
  branding?: {
    logo?: string;
    logo_icon?: string;
    primary_color?: string;
    tagline?: string;
  };
}

export default function SelectPharmacyScreen() {
  const router = useRouter();
  const { setOrganization } = useAuthStore();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      const result = await getPharmacyList();
      const data = result as any;
      const list = Array.isArray(data) ? data : data?.pharmacies || [];
      setPharmacies(list);
    } catch (err) {
      console.log('Failed to load pharmacies', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pharmacy: Pharmacy) => {
    setOrganization(pharmacy.id);
    router.push('/login');
  };

  const filtered = pharmacies.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.gphc_number?.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/rxsure-logo.png')}
          style={{ width: 140, height: 45, alignSelf: 'center', marginBottom: SPACING.md }}
          resizeMode="contain"
        />
        <View style={styles.headerBadge}>
          <Feather name="check-circle" size={12} color="#fff" />
          <Text style={styles.headerBadgeText}>NHS Approved Services</Text>
        </View>
        <Text style={styles.headerTitle}>Find Your Local{'\n'}Pharmacy</Text>
        <Text style={styles.headerSubtitle}>
          Book consultations with qualified pharmacists
        </Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={COLORS.slate400} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search pharmacy name, address, phone..."
            placeholderTextColor={COLORS.slate400}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={18} color={COLORS.slate400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pharmacy Count */}
      <View style={styles.countRow}>
        <Feather name="home" size={16} color={COLORS.slate600} />
        <Text style={styles.countText}>
          <Text style={styles.countNum}>{filtered.length}</Text> Pharmacies Available
        </Text>
        <View style={styles.countBadges}>
          <View style={styles.countBadge}>
            <Feather name="check-circle" size={12} color={COLORS.green} />
            <Text style={styles.countBadgeText}>GPhC Registered</Text>
          </View>
        </View>
      </View>

      {/* Pharmacy List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading pharmacies...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="search" size={40} color={COLORS.slate300} />
              <Text style={styles.emptyTitle}>No pharmacies found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Card Top Bar */}
              <View style={styles.cardTopBar} />

              {/* Pharmacy Info */}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>
                      {item.name?.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.pharmacyName} numberOfLines={2}>{item.name}</Text>
                    {item.gphc_number && (
                      <View style={styles.gphcRow}>
                        <Feather name="check-circle" size={12} color={COLORS.green} />
                        <Text style={styles.gphcText}>
                          {item.regulatory_body_label || 'GPhC'}: {item.gphc_number}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Address */}
                {item.address && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address!)}`)}
                  >
                    <Feather name="map-pin" size={14} color={COLORS.slate400} />
                    <Text style={styles.contactText} numberOfLines={2}>{item.address}</Text>
                  </TouchableOpacity>
                )}

                {/* Phone */}
                {item.phone && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  >
                    <Feather name="phone" size={14} color={COLORS.slate400} />
                    <Text style={styles.contactText}>{item.phone}</Text>
                  </TouchableOpacity>
                )}

                {/* Book Button */}
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookButtonText}>Book Consultation</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  header: {
    backgroundColor: COLORS.teal,
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: SPACING.xxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: RADIUS.full, marginBottom: SPACING.md,
  },
  headerBadgeText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '600' },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#fff',
    textAlign: 'center', lineHeight: 32, marginBottom: SPACING.sm,
  },
  headerSubtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: SPACING.xl },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 12,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.slate800 },
  countRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg,
  },
  countText: { fontSize: FONT_SIZE.sm, color: COLORS.slate600, flex: 1 },
  countNum: { fontWeight: '700', fontSize: FONT_SIZE.md, color: COLORS.slate900 },
  countBadges: { flexDirection: 'row', gap: SPACING.sm },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countBadgeText: { fontSize: FONT_SIZE.xs, color: COLORS.slate500 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: SPACING.md },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate500 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.slate400 },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    marginBottom: SPACING.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: COLORS.slate200,
  },
  cardTopBar: { height: 4, backgroundColor: COLORS.teal },
  cardBody: { padding: SPACING.lg },
  cardHeader: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  logoCircle: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#ccfbf1',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.teal },
  cardHeaderText: { flex: 1, justifyContent: 'center' },
  pharmacyName: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.slate800, lineHeight: 20 },
  gphcRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  gphcText: { fontSize: FONT_SIZE.xs, color: COLORS.green, fontWeight: '500' },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  contactText: { fontSize: FONT_SIZE.sm, color: COLORS.slate500, flex: 1, lineHeight: 18 },
  bookButton: {
    backgroundColor: COLORS.teal, borderRadius: RADIUS.sm,
    paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  bookButtonText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: '600' },
});
