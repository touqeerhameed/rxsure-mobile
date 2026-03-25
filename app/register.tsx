import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

type Step = 'details' | 'otp';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, organization } = useAuthStore();

  const [step, setStep] = useState<Step>('details');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address_line_1: '',
    city: '',
    postcode: '',
    password: '',
    confirm_password: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendOtp = async () => {
    const { first_name, last_name, email, phone, password, confirm_password, date_of_birth, gender, address_line_1, city, postcode } = form;

    if (!first_name || !last_name || !email || !phone || !password || !date_of_birth || !gender || !address_line_1 || !city || !postcode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (password !== confirm_password) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setOtpLoading(true);
    try {
      await sendRegistrationOtp(email, organization);
      setStep('otp');
      Alert.alert('OTP Sent', `A verification code has been sent to ${email}`);
    } catch (err: any) {
      const msg = err?.response?.data?._server_messages;
      let errorMsg = 'Failed to send OTP';
      if (msg) {
        try {
          const parsed = JSON.parse(msg);
          errorMsg = JSON.parse(parsed[0]).message;
        } catch {}
      }
      Alert.alert('Error', errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setOtpLoading(true);
    try {
      // Step 1: Verify OTP
      await verifyRegistrationOtp(form.email, otp, organization);

      // Step 2: Register patient
      await register({
        ...form,
        organization,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const msg = err?.response?.data?._server_messages || err?.response?.data?.message;
      let errorMsg = 'Registration failed';
      if (typeof msg === 'string') {
        try {
          const parsed = JSON.parse(msg);
          errorMsg = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]).message : parsed[0]?.message || msg;
        } catch {
          errorMsg = msg;
        }
      }
      Alert.alert('Error', errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <View style={styles.otpContainer}>
        <Feather name="mail" size={48} color={COLORS.teal} style={{ alignSelf: 'center', marginBottom: SPACING.xl }} />
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>Enter the code sent to {form.email}</Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter verification code"
          placeholderTextColor={COLORS.slate400}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, otpLoading && styles.buttonDisabled]}
          onPress={handleVerifyAndRegister}
          disabled={otpLoading}
        >
          {otpLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Verify & Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStep('details')} style={{ marginTop: SPACING.xl, alignItems: 'center' }}>
          <Text style={styles.loginLink}>Back to details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fields = [
    { key: 'first_name', label: 'First Name *', placeholder: 'John', autoCapitalize: 'words' as const },
    { key: 'last_name', label: 'Last Name *', placeholder: 'Smith', autoCapitalize: 'words' as const },
    { key: 'email', label: 'Email *', placeholder: 'john@example.com', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
    { key: 'phone', label: 'Phone *', placeholder: '07123456789', keyboardType: 'phone-pad' as const },
    { key: 'date_of_birth', label: 'Date of Birth * (YYYY-MM-DD)', placeholder: '1990-01-15' },
    { key: 'gender', label: 'Gender * (Male/Female/Other)', placeholder: 'Male' },
    { key: 'address_line_1', label: 'Address *', placeholder: '123 High Street' },
    { key: 'city', label: 'City *', placeholder: 'Manchester' },
    { key: 'postcode', label: 'Postcode *', placeholder: 'M1 1AA' },
    { key: 'password', label: 'Password *', placeholder: 'Min 8 characters', secure: true },
    { key: 'confirm_password', label: 'Confirm Password *', placeholder: 'Re-enter password', secure: true },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdfa', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 12 }}>
          <Feather name="home" size={14} color={COLORS.teal} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.teal }}>RxSure Pharmacy</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join RxSure to book pharmacy consultations</Text>

        {fields.map(({ key, label, placeholder, keyboardType, autoCapitalize, secure }) => (
          <View key={key} style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key as keyof typeof form]}
              onChangeText={(v) => updateField(key, v)}
              placeholder={placeholder}
              placeholderTextColor={COLORS.slate400}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              secureTextEntry={secure}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, (isLoading || otpLoading) && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={isLoading || otpLoading}
        >
          {otpLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scroll: { padding: SPACING.xxl, paddingBottom: 60 },
  otpContainer: { flex: 1, backgroundColor: COLORS.white, padding: SPACING.xxl, justifyContent: 'center' },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900 },
  subtitle: { fontSize: FONT_SIZE.base, color: COLORS.slate500, marginTop: 4, marginBottom: SPACING.xxl },
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
  button: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: SPACING.lg },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xxl },
  loginText: { fontSize: FONT_SIZE.base, color: COLORS.slate500 },
  loginLink: { fontSize: FONT_SIZE.base, color: COLORS.blue, fontWeight: '600' },
});
