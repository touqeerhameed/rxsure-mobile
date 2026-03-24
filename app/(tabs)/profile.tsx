import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { formatPatientName, getPatientInitials } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { patient, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const initials = getPatientInitials(patient?.first_name, patient?.last_name);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {formatPatientName(patient?.first_name, patient?.middle_name, patient?.last_name)}
        </Text>
        {patient?.email && <Text style={styles.email}>{patient.email}</Text>}
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {patient?.email && (
          <View style={styles.infoRow}>
            <Feather name="mail" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>{patient.email}</Text>
          </View>
        )}
        {patient?.phone && (
          <View style={styles.infoRow}>
            <Feather name="phone" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>{patient.phone}</Text>
          </View>
        )}
        {patient?.address_line_1 && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>
              {[patient.address_line_1, patient.city, patient.postcode].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')} activeOpacity={0.7}>
          <Feather name="settings" size={18} color={COLORS.slate600} />
          <Text style={styles.menuText}>Settings</Text>
          <Feather name="chevron-right" size={16} color={COLORS.slate300} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Feather name="shield" size={18} color={COLORS.slate600} />
          <Text style={styles.menuText}>Privacy & Security</Text>
          <Feather name="chevron-right" size={16} color={COLORS.slate300} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
        <Feather name="log-out" size={18} color={COLORS.red} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>RxSure v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg },
  profileCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.xxl,
    alignItems: 'center', marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  avatarText: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.white },
  name: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.slate900 },
  email: { fontSize: FONT_SIZE.sm, color: COLORS.slate400, marginTop: 2 },
  section: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  infoText: { fontSize: FONT_SIZE.base, color: COLORS.slate700, flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  menuText: { fontSize: FONT_SIZE.base, color: COLORS.slate700, flex: 1 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg,
    borderWidth: 1, borderColor: '#fca5a5', marginBottom: SPACING.lg,
  },
  logoutText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.red },
  version: { textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: 40 },
});
