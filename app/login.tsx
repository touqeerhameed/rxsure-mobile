import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useBiometric } from '../src/hooks/useBiometric';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, organization, setOrganization } = useAuthStore();
  const { isAvailable, isEnabled, biometricType, authenticate } = useBiometric();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Auto biometric login on mount
    if (isAvailable && isEnabled) {
      handleBiometricLogin();
    }
  }, [isAvailable, isEnabled]);

  const handleBiometricLogin = async () => {
    const success = await authenticate();
    if (success) {
      const { checkAuthStatus } = useAuthStore.getState();
      const valid = await checkAuthStatus();
      if (valid) {
        router.replace('/(tabs)/home');
      }
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (!organization) {
      router.replace('/select-pharmacy');
      return;
    }

    try {
      clearError();
      const result = await login(email.trim(), password);

      if (result?.requires_2fa) {
        router.push({ pathname: '/verify-otp', params: { email: email.trim() } });
        return;
      }

      router.replace('/(tabs)/home');
    } catch (err: any) {
      // error is already set in store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../assets/rxsure-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Patient Portal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Selected pharmacy */}
          <View style={styles.selectedPharmacy}>
            <Feather name="home" size={14} color={COLORS.primary} />
            <Text style={styles.selectedPharmacyText}>RxSure Pharmacy</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>Sign in to manage your bookings</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Change Pharmacy */}
          <TouchableOpacity
            style={styles.changePharmacy}
            onPress={() => {
              setOrganization('');
              router.replace('/select-pharmacy');
            }}
          >
            <Feather name="home" size={14} color={COLORS.teal} />
            <Text style={styles.changePharmacyText}>Change Pharmacy</Text>
          </TouchableOpacity>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="mail" size={18} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="lock" size={18} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputInner}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.slate400}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword
                  ? <Feather name="eye-off" size={18} color={COLORS.slate400} />
                  : <Feather name="eye" size={18} color={COLORS.slate400} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => router.push('/reset-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Biometric Login */}
          {isAvailable && isEnabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              activeOpacity={0.7}
            >
              <Feather name="smartphone" size={24} color={COLORS.navy} />
              <Text style={styles.biometricText}>Login with {biometricType}</Text>
            </TouchableOpacity>
          )}

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 70,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 70,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  form: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxl,
    paddingBottom: 40,
  },
  selectedPharmacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  selectedPharmacyText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate500,
    marginBottom: SPACING.xxl,
  },
  changePharmacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  changePharmacyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.teal,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: COLORS.redBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONT_SIZE.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.slate50,
  },
  inputIcon: {
    marginLeft: SPACING.lg,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate800,
  },
  eyeIcon: {
    padding: SPACING.lg,
  },
  forgotText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.blue,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginBottom: SPACING.xxl,
  },
  biometricText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.navy,
    fontWeight: '500',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  registerText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate500,
  },
  registerLink: {
    fontSize: FONT_SIZE.base,
    color: COLORS.blue,
    fontWeight: '600',
  },
});
