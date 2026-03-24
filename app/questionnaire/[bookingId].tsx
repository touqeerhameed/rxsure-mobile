import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getQuestionnaire, submitQuestionnaireResponse } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import type { Question, Questionnaire } from '../../src/types';

export default function QuestionnaireScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bookingId && token) {
      getQuestionnaire(bookingId, token)
        .then(setQuestionnaire)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [bookingId, token]);

  const setResponse = (questionName: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionName]: value }));
  };

  const isQuestionVisible = (question: Question): boolean => {
    if (!question.depends_on_question) return true;
    return responses[question.depends_on_question] === question.depends_on_value;
  };

  const handleSubmit = async () => {
    if (!token || !bookingId) return;
    setSubmitting(true);
    try {
      await submitQuestionnaireResponse({ token, booking_id: bookingId, responses });
      Alert.alert('Submitted', questionnaire?.completion_message || 'Your responses have been recorded', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  if (!questionnaire) {
    return <View style={styles.center}><Text>No questionnaire found</Text></View>;
  }

  const visibleQuestions = questionnaire.questions.filter(isQuestionVisible);
  const progress = Object.keys(responses).length / visibleQuestions.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{questionnaire.title}</Text>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>{Object.keys(responses).length} of {visibleQuestions.length} answered</Text>

      {/* Questions */}
      {visibleQuestions.map((q, index) => (
        <View key={q.name} style={styles.questionCard}>
          <Text style={styles.questionNum}>Q{index + 1}</Text>
          <Text style={styles.questionText}>{q.question}</Text>
          {q.required && <Text style={styles.required}>Required</Text>}

          {q.question_type === 'Text' && (
            <TextInput
              style={styles.textInput}
              value={responses[q.name] || ''}
              onChangeText={(v) => setResponse(q.name, v)}
              placeholder="Type your answer"
              placeholderTextColor={COLORS.slate400}
              multiline
            />
          )}

          {q.question_type === 'Yes/No' && (
            <View style={styles.yesNoRow}>
              {['Yes', 'No'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, responses[q.name] === opt && styles.optionSelected]}
                  onPress={() => setResponse(q.name, opt)}
                >
                  <Text style={[styles.optionText, responses[q.name] === opt && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {q.question_type === 'Select' && q.options && (
            <View style={styles.optionsCol}>
              {q.options.split('\n').map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionBtn, responses[q.name] === opt && styles.optionSelected]}
                  onPress={() => setResponse(q.name, opt)}
                >
                  <Text style={[styles.optionText, responses[q.name] === opt && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {q.warning_message && responses[q.name] === q.warning_value && (
            <View style={styles.warning}>
              <Text style={styles.warningText}>{q.warning_message}</Text>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color={COLORS.white} /> : (
          <>
            <Feather name="check-circle" size={18} color={COLORS.white} />
            <Text style={styles.submitText}>Submit Answers</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.slate900, marginBottom: SPACING.lg },
  progressBar: { height: 6, backgroundColor: COLORS.slate200, borderRadius: 3, marginBottom: SPACING.sm },
  progressFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 3 },
  progressText: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: SPACING.xxl },
  questionCard: { marginBottom: SPACING.xxl, paddingBottom: SPACING.xxl, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  questionNum: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.blue, marginBottom: SPACING.xs },
  questionText: { fontSize: FONT_SIZE.base, fontWeight: '500', color: COLORS.slate800, marginBottom: SPACING.sm, lineHeight: 22 },
  required: { fontSize: FONT_SIZE.xs, color: COLORS.red, marginBottom: SPACING.md },
  textInput: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.sm,
    padding: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.slate800,
    minHeight: 80, textAlignVertical: 'top',
  },
  yesNoRow: { flexDirection: 'row', gap: SPACING.md },
  optionsCol: { gap: SPACING.sm },
  optionBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.slate200 },
  optionSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  optionText: { fontSize: FONT_SIZE.sm, color: COLORS.slate700 },
  optionTextSelected: { color: COLORS.white, fontWeight: '600' },
  warning: { backgroundColor: COLORS.amberBg, borderRadius: RADIUS.sm, padding: SPACING.md, marginTop: SPACING.sm, borderLeftWidth: 3, borderLeftColor: COLORS.amber },
  warningText: { fontSize: FONT_SIZE.sm, color: COLORS.amber },
  submitBtn: {
    backgroundColor: COLORS.green, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.lg,
  },
  submitText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
