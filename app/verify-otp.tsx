import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { verifyPatientOtp, resendPatientOtp } from '../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setToken, setPatient, organization } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyPatientOtp(email!, code, organization);
      if (result?.token) {
        await setToken(result.token);
        setPatient(result.patient);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendPatientOtp(email!, organization);
      Alert.alert('Success', 'A new OTP has been sent to your email');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to{'\n'}{email}</Text>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputs.current[i] = ref; }}
            style={[styles.otpInput, digit ? styles.otpFilled : null]}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendRow}>
        <Text style={styles.resendText}>
          {resending ? 'Sending...' : "Didn't receive the code? "}
          {!resending && <Text style={styles.resendLink}>Resend</Text>}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.white, padding: SPACING.xxl, paddingTop: 60 },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.slate500, textAlign: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxxl },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.xxxl },
  otpInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: COLORS.slate200, borderRadius: RADIUS.md,
    textAlign: 'center', fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate800,
  },
  otpFilled: { borderColor: COLORS.navy, backgroundColor: '#f0f4ff' },
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  resendRow: { marginTop: SPACING.xxl, alignItems: 'center' },
  resendText: { fontSize: FONT_SIZE.base, color: COLORS.slate500 },
  resendLink: { color: COLORS.blue, fontWeight: '600' },
});
