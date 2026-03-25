import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { submitFeedback } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';

const CATEGORIES = ['App Experience', 'Service Quality', 'Suggestions', 'Other'];

export default function FeedbackScreen() {
  const { token } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your feedback message');
      return;
    }
    if (!token) return;
    setError('');
    setSubmitting(true);
    try {
      await submitFeedback(token, { rating, category, message: message.trim() });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <Feather name="heart" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.successTitle}>Thank you for your feedback!</Text>
          <Text style={styles.successDesc}>
            Your feedback helps us improve our services. We appreciate you taking the time to share your thoughts.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              setSuccess(false);
              setRating(0);
              setCategory('');
              setMessage('');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>Submit Another</Text>
          </TouchableOpacity>
        </ScrollView>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Rating */}
          <Text style={styles.label}>How would you rate your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Feather
                  name={star <= rating ? 'star' : 'star'}
                  size={36}
                  color={star <= rating ? '#f59e0b' : COLORS.slate300}
                  style={star <= rating ? { textShadowColor: '#fbbf24', textShadowRadius: 2 } : undefined}
                />
                {star <= rating && (
                  <View style={styles.starFill}>
                    <Text style={styles.starFillIcon}>&#9733;</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating === 0 ? 'Tap to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
          </Text>

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.radioGroup}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.radioItem, category === cat && styles.radioItemActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, category === cat && styles.radioOuterActive]}>
                  {category === cat && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, category === cat && styles.radioLabelActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message */}
          <Text style={styles.label}>Your Feedback</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us what you think..."
            placeholderTextColor={COLORS.slate400}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  successContent: { padding: SPACING.xxl, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  starButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  starFill: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starFillIcon: {
    fontSize: 34,
    color: '#f59e0b',
    lineHeight: 38,
  },
  ratingLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate500,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  radioGroup: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  radioItemActive: {
    backgroundColor: COLORS.primaryBg,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioOuterActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate700,
  },
  radioLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate800,
  },
  textArea: {
    minHeight: 120,
    paddingTop: SPACING.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.redBg,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.red,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: SPACING.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  successIcon: {
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: SPACING.md,
  },
  successDesc: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
});
