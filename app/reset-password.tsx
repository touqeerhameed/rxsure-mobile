import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { frappeClient } from '../src/api/client';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

const API = 'consultation.consultation.api.patient_api';
type Step = 'email' | 'otp' | 'newPassword' | 'done';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { organization } = useAuthStore();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showError = (msg: string) => setError(msg);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) { showError('Please enter your email'); return; }
    setLoading(true); setError('');
    try {
      const result = await frappeClient.call(`${API}.forgot_password_otp`, { email: email.trim(), organization });
      if ((result as any)?.success === false) { showError((result as any).error); return; }
      setStep('otp');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) { showError('Please enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      const result = await frappeClient.call(`${API}.verify_reset_otp`, { email: email.trim(), otp });
      const data = result as any;
      if (!data?.success) { showError(data?.error || 'Verification failed'); return; }
      setResetToken(data.reset_token);
      setStep('newPassword');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  // Step 3: Set new password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { showError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { showError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const result = await frappeClient.call(`${API}.reset_password_with_token`, {
        email: email.trim(), reset_token: resetToken, new_password: newPassword,
      });
      const data = result as any;
      if (!data?.success) { showError(data?.error || 'Reset failed'); return; }
      setStep('done');
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  // Step 4: Done
  if (step === 'done') {
    return (
      <View style={styles.container}>
        <Feather name="check-circle" size={56} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: SPACING.xl }} />
        <Text style={styles.title}>Password Reset!</Text>
        <Text style={styles.subtitle}>Your password has been changed successfully. You can now login with your new password.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {['Email', 'Verify', 'New Password'].map((label, i) => {
          const stepIndex = ['email', 'otp', 'newPassword'].indexOf(step);
          const isActive = i <= stepIndex;
          return (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Step 1: Email */}
      {step === 'email' && (
        <>
          <Feather name="lock" size={40} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: SPACING.lg }} />
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset code</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="Enter your email" placeholderTextColor={COLORS.slate400}
              keyboardType="email-address" autoCapitalize="none" />
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* Step 2: OTP */}
      {step === 'otp' && (
        <>
          <Feather name="mail" size={40} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: SPACING.lg }} />
          <Text style={styles.title}>Enter Reset Code</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
          <TextInput style={styles.otpInput} value={otp} onChangeText={setOtp}
            placeholder="Enter 6-digit code" placeholderTextColor={COLORS.slate400}
            keyboardType="number-pad" maxLength={6} textAlign="center" />
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Verify Code</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); }} style={{ marginTop: SPACING.xl, alignItems: 'center' }}>
            <Text style={styles.linkText}>Resend code</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step 3: New Password */}
      {step === 'newPassword' && (
        <>
          <Feather name="shield" size={40} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: SPACING.lg }} />
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>Choose a strong password (min 8 characters)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword}
              placeholder="Min 8 characters" placeholderTextColor={COLORS.slate400} secureTextEntry />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
              placeholder="Re-enter password" placeholderTextColor={COLORS.slate400} secureTextEntry />
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: SPACING.xxl, alignItems: 'center' }}>
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: SPACING.xxl, justifyContent: 'center' },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.xxxl },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.slate200, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.slate400 },
  stepNumActive: { color: COLORS.white },
  stepLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.slate500, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxl },
  errorBox: { backgroundColor: COLORS.redBg, borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.red },
  errorText: { color: COLORS.red, fontSize: FONT_SIZE.sm },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate700, marginBottom: SPACING.sm },
  input: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 14, fontSize: FONT_SIZE.base,
    color: COLORS.slate800, backgroundColor: COLORS.slate50,
  },
  otpInput: {
    borderWidth: 2, borderColor: COLORS.slate200, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 16, fontSize: FONT_SIZE.xxl,
    fontWeight: '700', color: COLORS.slate800, backgroundColor: COLORS.slate50,
    letterSpacing: 8, marginBottom: SPACING.xxl,
  },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  linkText: { fontSize: FONT_SIZE.base, color: COLORS.blue, fontWeight: '500' },
});
