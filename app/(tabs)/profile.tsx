import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { formatPatientName, getPatientInitials } from '../../src/utils/formatting';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { patient, logout, setOrganization } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const doLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    setOrganization('');
    router.replace('/select-pharmacy');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
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
        <View style={styles.pharmacyChip}>
          <Feather name="home" size={12} color={COLORS.primary} />
          <Text style={styles.pharmacyChipText}>RxSure Pharmacy</Text>
        </View>
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
        {patient?.date_of_birth && (
          <View style={styles.infoRow}>
            <Feather name="calendar" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>{new Date(patient.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        )}
        {patient?.gender && (
          <View style={styles.infoRow}>
            <Feather name="user" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>{patient.gender}</Text>
          </View>
        )}
        {(patient as any)?.nhs_number && (
          <View style={styles.infoRow}>
            <Feather name="shield" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>NHS: {(patient as any).nhs_number}</Text>
          </View>
        )}
        {patient?.address_line_1 && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={16} color={COLORS.slate400} />
            <Text style={styles.infoText}>
              {[patient.address_line_1, patient.address_line_2, patient.city, patient.postcode].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications' as any)} activeOpacity={0.7}>
          <Feather name="bell" size={18} color={COLORS.slate600} />
          <Text style={styles.menuText}>Notifications</Text>
          <Feather name="chevron-right" size={16} color={COLORS.slate300} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help')} activeOpacity={0.7}>
          <Feather name="help-circle" size={18} color={COLORS.slate600} />
          <Text style={styles.menuText}>Help & Support</Text>
          <Feather name="chevron-right" size={16} color={COLORS.slate300} />
        </TouchableOpacity>
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

      <Image
        source={require('../../assets/rxsure-logo.png')}
        style={styles.footerLogo}
        resizeMode="contain"
      />
      <Text style={styles.version}>RxSure v1.0.0</Text>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Feather name="log-out" size={32} color={COLORS.red} style={{ alignSelf: 'center', marginBottom: SPACING.md }} />
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalText}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={doLogout}>
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  pharmacyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md,
    backgroundColor: COLORS.primaryBg, paddingHorizontal: SPACING.md, paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  pharmacyChipText: { fontSize: FONT_SIZE.xs, fontWeight: '500', color: COLORS.primary },
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
  footerLogo: { width: 120, height: 40, alignSelf: 'center', marginBottom: SPACING.sm },
  version: { textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  modalBox: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.xxl, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.slate900, textAlign: 'center', marginBottom: SPACING.sm },
  modalText: { fontSize: FONT_SIZE.base, color: COLORS.slate500, textAlign: 'center', marginBottom: SPACING.xxl },
  modalButtons: { flexDirection: 'row', gap: SPACING.md },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.slate200, alignItems: 'center' },
  modalCancelText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate600 },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.sm, backgroundColor: COLORS.red, alignItems: 'center' },
  modalConfirmText: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white },
});
