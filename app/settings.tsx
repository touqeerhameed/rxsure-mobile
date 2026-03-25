import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBiometric } from '../src/hooks/useBiometric';
import { useSettingsStore } from '../src/store/settingsStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';
import BottomNav from '../src/components/BottomNav';

export default function SettingsScreen() {
  const { isAvailable, isEnabled, biometricType, enableBiometric, disableBiometric } = useBiometric();
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore();

  const toggleBiometric = async (value: boolean) => {
    if (value) await enableBiometric();
    else await disableBiometric();
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Security */}
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="smartphone" size={20} color={COLORS.navy} />
            <View>
              <Text style={styles.settingLabel}>{biometricType} Login</Text>
              <Text style={styles.settingDesc}>
                {isAvailable ? 'Quick sign in with biometric' : 'Not available on this device'}
              </Text>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={toggleBiometric}
            disabled={!isAvailable}
            trackColor={{ false: COLORS.slate200, true: COLORS.navy }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="bell" size={20} color={COLORS.navy} />
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Booking reminders and updates</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: COLORS.slate200, true: COLORS.navy }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>RxSure Patient App</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Developer</Text>
          <Text style={styles.infoValue}>QASTCO Limited</Text>
        </View>
      </View>
    </ScrollView>
    <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  sectionTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate400,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  settingLabel: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800 },
  settingDesc: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.slate100,
  },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.slate500 },
  infoValue: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate700 },
});
