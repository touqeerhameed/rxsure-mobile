import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { requestPasswordReset } from '../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim(), organization);
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>We've sent a password reset link to {email}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
      <View style={styles.inputGroup}>
        <View style={styles.inputWithIcon}>
          <Feather name="mail" size={18} color={COLORS.slate400} style={{ marginLeft: SPACING.lg }} />
          <TextInput
            style={styles.inputInner}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.slate400}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: SPACING.xxl, justifyContent: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.slate500, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxxl },
  inputGroup: { marginBottom: SPACING.xxl },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.md, backgroundColor: COLORS.slate50 },
  inputInner: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: 14, fontSize: FONT_SIZE.base, color: COLORS.slate800 },
  button: { backgroundColor: COLORS.navy, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
