import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { changePassword } from '../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';
import BottomNav from '../src/components/BottomNav';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!currentPassword.trim()) { setError('Please enter your current password'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (currentPassword === newPassword) { setError('New password must be different from current'); return; }
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await changePassword(token, currentPassword, newPassword);
      if ((result as any)?.success === false) {
        setError((result as any)?.message || 'Failed to change password');
      } else {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
          <Feather name="check-circle" size={56} color={COLORS.green} />
          <Text style={styles.successTitle}>Password Changed!</Text>
          <Text style={styles.successDesc}>Your password has been updated successfully.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.buttonText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconHeader}>
          <Feather name="lock" size={40} color={COLORS.primary} />
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Choose a strong password with at least 8 characters</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Current Password */}
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color={COLORS.slate400} style={{ marginLeft: SPACING.lg }} />
          <TextInput
            style={styles.inputInner}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={COLORS.slate400}
            secureTextEntry={!showCurrent}
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={{ padding: SPACING.lg }}>
            <Feather name={showCurrent ? 'eye-off' : 'eye'} size={18} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color={COLORS.slate400} style={{ marginLeft: SPACING.lg }} />
          <TextInput
            style={styles.inputInner}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Min 8 characters"
            placeholderTextColor={COLORS.slate400}
            secureTextEntry={!showNew}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ padding: SPACING.lg }}>
            <Feather name={showNew ? 'eye-off' : 'eye'} size={18} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputRow}>
          <Feather name="lock" size={18} color={COLORS.slate400} style={{ marginLeft: SPACING.lg }} />
          <TextInput
            style={styles.inputInner}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={COLORS.slate400}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: SPACING.lg }}>
            <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={COLORS.slate400} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.7}
        >
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Update Password</Text>}
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  successContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
  iconHeader: { alignItems: 'center', marginBottom: SPACING.xxl, marginTop: SPACING.lg },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.slate900, marginTop: SPACING.md },
  subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.slate500, marginTop: SPACING.xs, textAlign: 'center' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate700, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.md, backgroundColor: COLORS.white,
  },
  inputInner: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: FONT_SIZE.base, color: COLORS.slate800 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.redBg, borderRadius: RADIUS.sm, padding: SPACING.md,
    borderLeftWidth: 3, borderLeftColor: COLORS.red,
  },
  errorText: { fontSize: FONT_SIZE.sm, color: COLORS.red, flex: 1 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 14,
    alignItems: 'center', marginTop: SPACING.xxl,
  },
  buttonText: { fontSize: FONT_SIZE.base, fontWeight: '700', color: COLORS.white },
  successTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.slate900, marginTop: SPACING.lg },
  successDesc: { fontSize: FONT_SIZE.base, color: COLORS.slate500, marginTop: SPACING.sm, textAlign: 'center', marginBottom: SPACING.xxl },
});
