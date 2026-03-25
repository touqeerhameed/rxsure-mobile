import { useEffect, useState, createElement } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch, Platform, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../src/store/authStore';
import { getPreScreeningPageData, submitPreScreeningAnswers, uploadFile } from '../../src/api/services';
import { API_BASE_URL } from '../../src/api/client';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';
import { formatPatientName, getPatientInitials, formatDate, formatTime } from '../../src/utils/formatting';

interface Question {
  name: string;
  question_text: string;
  question_type: string;
  question_template?: string;
  question_id?: string;
  options?: any[];
  required?: boolean;
  depends_on?: string;
  depends_on_value?: string;
  depends_on_operator?: string;
  depends_on_question?: string;
  depends_on_question_2?: string;
  depends_on_value_2?: string;
  depends_on_operator_2?: string;
  depends_on_logic?: string;
  depends_on_gender?: boolean;
  gender_condition?: string;
  depends_on_age?: boolean;
  age_value?: number;
  age_unit?: string;
  age_operator?: string;
  patient_condition_action?: string;
  patient_condition_logic?: string;
  depends_on_calculated_metric?: string;
  calculated_metric_value?: string;
  calculated_metric_operator?: string;
  warning_message?: string;
  warning_trigger_value?: string;
  warning_enabled?: boolean;
}

interface QuestionnaireData {
  title: string;
  questionnaire_name: string;
  questions: Question[];
  completion_message?: string;
}

export default function QuestionnaireScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { token, organization, patient } = useAuthStore();
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bookingId && token) {
      getPreScreeningPageData(bookingId, token)
        .then((result: any) => {
          const data = result?.questionnaire || result;
          setQuestionnaire(data);
          if (result?.booking) setBookingInfo(result.booking);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [bookingId, token]);

  // Strip HTML tags from question text
  const stripHtml = (html: string): string => {
    return (html || '').replace(/<[^>]*>/g, '').trim();
  };

  const setResponse = (questionName: string, value: any) => {
    setResponses((prev) => ({ ...prev, [questionName]: value }));
  };

  // Evaluate condition operators (matches patient portal logic)
  const evaluateCondition = (
    answer: string | string[] | undefined,
    targetValue: string | undefined,
    operator: string | undefined
  ): boolean => {
    if (!operator || targetValue === undefined) return true;
    let parsedTarget: string | string[] = targetValue;
    try { const parsed = JSON.parse(targetValue); if (Array.isArray(parsed)) parsedTarget = parsed; } catch {}
    const answerStr = Array.isArray(answer) ? answer : String(answer || '');
    const targetArr = Array.isArray(parsedTarget) ? parsedTarget : [parsedTarget];

    switch (operator) {
      case 'equals':
      case 'is_any_of':
        return Array.isArray(answerStr) ? targetArr.some(t => answerStr.includes(t)) : targetArr.includes(answerStr);
      case 'not_equals':
      case 'is_none_of':
        return Array.isArray(answerStr) ? !targetArr.some(t => answerStr.includes(t)) : !targetArr.includes(answerStr);
      case 'contains':
      case 'contains_any':
        return Array.isArray(answerStr) ? targetArr.some(t => answerStr.includes(t)) : targetArr.some(t => answerStr.includes(t));
      case 'not_contains':
        return Array.isArray(answerStr) ? !targetArr.some(t => answerStr.includes(t)) : !targetArr.some(t => answerStr.includes(t));
      case 'contains_all':
        return Array.isArray(answerStr) ? targetArr.every(t => answerStr.includes(t)) : false;
      case 'is_empty':
        return !answer || (Array.isArray(answer) && answer.length === 0);
      case 'is_not_empty':
        return !!answer && (!Array.isArray(answer) || answer.length > 0);
      case 'greater_than':
        return parseFloat(String(answer)) > parseFloat(targetArr[0]);
      case 'less_than':
        return parseFloat(String(answer)) < parseFloat(targetArr[0]);
      case 'greater_equal':
      case 'greater_than_equals':
        return parseFloat(String(answer)) >= parseFloat(targetArr[0]);
      case 'less_equal':
      case 'less_than_equals':
        return parseFloat(String(answer)) <= parseFloat(targetArr[0]);
      default:
        return targetArr.includes(String(answer));
    }
  };

  // Gender/age-based patient condition check
  const evaluatePatientCondition = (question: Question): boolean => {
    if (!patient) return true;
    let genderResult = true;
    let ageResult = true;

    if (question.depends_on_gender && question.gender_condition) {
      const patientGender = (patient.gender || '').toLowerCase();
      const condition = question.gender_condition.toLowerCase();
      if (condition.includes('not ')) {
        genderResult = patientGender !== condition.replace('not ', '');
      } else {
        genderResult = patientGender === condition;
      }
    }

    if (question.depends_on_age && question.age_value !== undefined && patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;

      let ageInUnit = age;
      if (question.age_unit === 'months') ageInUnit = age * 12;
      else if (question.age_unit === 'days') ageInUnit = age * 365;
      else if (question.age_unit === 'weeks') ageInUnit = age * 52;

      switch (question.age_operator) {
        case 'greater_than': ageResult = ageInUnit > question.age_value; break;
        case 'less_than': ageResult = ageInUnit < question.age_value; break;
        case 'equals': ageResult = ageInUnit === question.age_value; break;
        case 'between':
          const [minAge, maxAge] = String(question.age_value).split('-').map(Number);
          ageResult = ageInUnit >= minAge && ageInUnit <= maxAge;
          break;
        default: ageResult = true;
      }
    }

    const logic = question.patient_condition_logic || 'AND';
    return logic === 'OR' ? (genderResult || ageResult) : (genderResult && ageResult);
  };

  // Calculate BMI from weight/height responses
  const getCalculatedMetrics = () => {
    const allQ = questionnaire?.questions || [];
    let weightKg: number | undefined;
    let heightCm: number | undefined;
    for (const q of allQ) {
      const qId = q.question_template || q.question_id || q.name;
      const val = responses[qId];
      if (!val) continue;
      const text = (q.question_text || '').toLowerCase();
      if (text.includes('weight')) {
        const num = typeof val === 'object' ? parseFloat(val.value) : parseFloat(val);
        const unit = typeof val === 'object' ? val.unit : 'kg';
        if (!isNaN(num)) {
          if (unit === 'lb') weightKg = num * 0.453592;
          else if (unit === 'st') weightKg = num * 6.35029;
          else weightKg = num;
        }
      } else if (text.includes('height')) {
        const num = typeof val === 'object' ? parseFloat(val.value) : parseFloat(val);
        const unit = typeof val === 'object' ? val.unit : 'cm';
        if (!isNaN(num)) {
          if (unit === 'ft') heightCm = num * 30.48;
          else if (unit === 'in') heightCm = num * 2.54;
          else if (unit === 'm') heightCm = num * 100;
          else heightCm = num;
        }
      }
    }
    const bmi = weightKg && heightCm ? weightKg / ((heightCm / 100) ** 2) : undefined;
    const bmi_category = bmi ? (bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese') : undefined;
    return { bmi, bmi_category };
  };

  const isQuestionVisible = (question: Question): boolean => {
    // 1. Patient profile conditions (gender, age)
    if (question.depends_on_gender || question.depends_on_age) {
      const conditionMet = evaluatePatientCondition(question);
      if (question.patient_condition_action === 'hide_question' && !conditionMet) return false;
    }

    // 2. Calculated metric conditions (BMI)
    if (question.depends_on_calculated_metric) {
      const metrics = getCalculatedMetrics();
      const metricValue = question.depends_on_calculated_metric === 'bmi'
        ? metrics.bmi : question.depends_on_calculated_metric === 'bmi_category'
        ? metrics.bmi_category : undefined;
      if (metricValue === undefined) return false;
      const met = evaluateCondition(String(metricValue), question.calculated_metric_value, question.calculated_metric_operator);
      if (!met) return false;
    }

    // 3. Question dependencies with operators
    const depQ = question.depends_on_question || question.depends_on;
    const depV = question.depends_on_value;
    if (depQ && depV) {
      const depAnswer = responses[depQ];
      const condition1Met = evaluateCondition(depAnswer, depV, question.depends_on_operator || 'equals');

      if (question.depends_on_question_2 && question.depends_on_value_2) {
        const depAnswer2 = responses[question.depends_on_question_2];
        const condition2Met = evaluateCondition(depAnswer2, question.depends_on_value_2, question.depends_on_operator_2 || 'equals');
        const logic = question.depends_on_logic || 'AND';
        return logic === 'OR' ? (condition1Met || condition2Met) : (condition1Met && condition2Met);
      }
      return condition1Met;
    }

    return true;
  };

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const pickImage = async (qId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') alert('Permission to access media library is required.');
      else Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingFor(qId);
      try {
        const fileName = asset.fileName || `upload_${Date.now()}.jpg`;
        const base64Data = asset.base64 || '';
        const res = await uploadFile(token!, base64Data, fileName, patient?.id || patient?.name);
        setResponse(qId, res.file_url);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Upload Error', msg);
      } finally {
        setUploadingFor(null);
      }
    }
  };

  const pickVideo = async (qId: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') alert('Permission to access media library is required.');
      else Alert.alert('Permission Required', 'Please allow access to your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.7,
      base64: true,
      videoMaxDuration: 120,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingFor(qId);
      try {
        const fileName = asset.fileName || `video_${Date.now()}.mp4`;
        const base64Data = asset.base64 || '';
        const res = await uploadFile(token!, base64Data, fileName, patient?.id || patient?.name);
        setResponse(qId, res.file_url);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Upload Error', msg);
      } finally {
        setUploadingFor(null);
      }
    }
  };

  const takePhoto = async (qId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') alert('Camera permission is required.');
      else Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploadingFor(qId);
      try {
        const fileName = `photo_${Date.now()}.jpg`;
        const base64Data = asset.base64 || '';
        const res = await uploadFile(token!, base64Data, fileName, patient?.id || patient?.name);
        setResponse(qId, res.file_url);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Upload failed';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Upload Error', msg);
      } finally {
        setUploadingFor(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!token || !bookingId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitPreScreeningAnswers({ token, booking_id: bookingId, answers: responses, business_id: organization });
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <View style={[styles.center, { padding: SPACING.xxl }]}>
          <Feather name="check-circle" size={64} color={COLORS.primary} />
          <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.slate900, marginTop: SPACING.xl, textAlign: 'center' }}>
            Pre-Screening Complete!
          </Text>
          <Text style={{ fontSize: FONT_SIZE.base, color: COLORS.slate500, marginTop: SPACING.sm, textAlign: 'center' }}>
            {questionnaire?.completion_message || 'Your responses have been submitted successfully.'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: SPACING.xxl, marginTop: SPACING.xxxl }}
            onPress={() => router.replace({ pathname: `/booking/[id]` as any, params: { id: bookingId, refresh: Date.now().toString() } })}
          >
            <Text style={{ color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' }}>Back to Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginTop: SPACING.lg }}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={{ fontSize: FONT_SIZE.base, color: COLORS.blue, fontWeight: '500' }}>View All Bookings</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!questionnaire) {
    return <View style={styles.center}><Text>No questionnaire found</Text></View>;
  }

  const allQuestions = questionnaire.questions || [];
  const visibleQuestions = allQuestions.filter(isQuestionVisible);
  const progress = visibleQuestions.length > 0 ? Object.keys(responses).length / visibleQuestions.length : 0;

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Pre-Screening Questionnaire</Text>
        <Text style={styles.headerSubtitle}>Please complete this before your appointment</Text>
      </View>

      {/* Booking Info */}
      {bookingInfo && (
        <View style={styles.bookingInfoRow}>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Service</Text>
            <Text style={styles.bookingInfoValue}>{bookingInfo.service_name}</Text>
          </View>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Date</Text>
            <Text style={styles.bookingInfoValue}>{formatDate(bookingInfo.booking_date)}</Text>
          </View>
          <View style={styles.bookingInfoItem}>
            <Text style={styles.bookingInfoLabel}>Time</Text>
            <Text style={styles.bookingInfoValue}>{formatTime(bookingInfo.booking_time)}</Text>
          </View>
        </View>
      )}

      {/* Patient Info */}
      {patient && (
        <View style={styles.patientRow}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>{getPatientInitials(patient.first_name, patient.last_name)}</Text>
          </View>
          <View>
            <Text style={styles.patientName}>{formatPatientName(patient.first_name, undefined, patient.last_name)}</Text>
            {patient.date_of_birth && (
              <Text style={styles.patientDob}>DOB: {new Date(patient.date_of_birth).toLocaleDateString('en-GB')} • {Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000)} years old</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>{Object.keys(responses).length} of {visibleQuestions.length} answered</Text>

      {/* Questions */}
      {visibleQuestions.map((q: any, index) => {
        const questionText = stripHtml(q.question_text || q.question || '');
        const qId = q.question_template || q.question_id || q.name || `q_${index}`;

        // Parse options - handle nested { options: [{value, label}] } or array or string
        let options: { value: string; label: string }[] = [];
        const rawOpts = q.options;
        if (rawOpts) {
          const optArray = rawOpts.options || (Array.isArray(rawOpts) ? rawOpts : null);
          if (Array.isArray(optArray)) {
            options = optArray.map((o: any) => ({
              value: typeof o === 'string' ? o : o.value || o.label || String(o),
              label: typeof o === 'string' ? o : o.label || o.value || String(o),
            }));
          } else if (typeof rawOpts === 'string') {
            options = rawOpts.split('\n').filter(Boolean).map((o: string) => ({ value: o, label: o }));
          }
        }

        // Heading — render as a styled card like patient portal
        if (q.question_type === 'Heading') {
          // Extract title from HTML: first <strong>, <b>, <h*> tag content, or first line
          const rawHtml = q.question_text || q.question || '';
          const strongMatch = rawHtml.match(/<(?:strong|b|h[1-6])[^>]*>(.*?)<\/(?:strong|b|h[1-6])>/i);
          const title = strongMatch ? stripHtml(strongMatch[1]) : questionText.split(/\.\s/)[0];
          const desc = strongMatch
            ? stripHtml(rawHtml.replace(strongMatch[0], '')).trim()
            : questionText.substring(title.length).replace(/^\.\s*/, '');
          return (
            <View key={qId} style={styles.headingCard}>
              <Text style={styles.headingTitle}>{title}</Text>
              {desc ? <Text style={styles.headingDesc}>{desc}</Text> : null}
              {q.category_name ? <Text style={styles.headingCategory}>{q.category_name}</Text> : null}
            </View>
          );
        }

        // Text Block — render as informational content
        if (q.question_type === 'Text Block' || q.question_type === 'Image') {
          return (
            <View key={qId} style={styles.textBlockCard}>
              {q.category_name ? <Text style={styles.textBlockCategory}>{q.category_name}</Text> : null}
              <Text style={styles.textBlockText}>{questionText}</Text>
            </View>
          );
        }

        return (
          <View key={qId} style={styles.questionCard}>
            <Text style={styles.questionNum}>Q{index + 1}</Text>
            {q.category_name ? <Text style={styles.categoryLabel}>{q.category_name}</Text> : null}
            <Text style={styles.questionText}>{questionText}</Text>
            {q.is_required === 1 ? <Text style={styles.required}>Required</Text> : null}

            {/* Short Answer */}
            {(q.question_type === 'Short Answer') && (
              <TextInput
                style={[styles.textInput, { minHeight: 44 }]}
                value={responses[qId] || ''}
                onChangeText={(v) => setResponse(qId, v)}
                placeholder="Type your answer"
                placeholderTextColor={COLORS.slate400}
              />
            )}

            {/* Long Answer / Text */}
            {(q.question_type === 'Text' || q.question_type === 'Long Text' || q.question_type === 'Long Answer') && (
              <TextInput
                style={styles.textInput}
                value={responses[qId] || ''}
                onChangeText={(v) => setResponse(qId, v)}
                placeholder="Type your answer"
                placeholderTextColor={COLORS.slate400}
                multiline
              />
            )}

            {/* Number with stepper */}
            {q.question_type === 'Number' && (() => {
              const numVal = responses[qId] !== undefined ? parseFloat(String(typeof responses[qId] === 'object' ? responses[qId]?.value : responses[qId])) : NaN;
              const minVal = q.min_value;
              const maxVal = q.max_value;
              const unitOpts = q.unit_options || [];
              const defaultUnit = q.default_unit || (unitOpts[0]?.unit_symbol || unitOpts[0]?.unit_code || '');
              const currentUnit = typeof responses[qId] === 'object' ? responses[qId]?.unit : defaultUnit;
              const setNum = (v: string) => {
                if (q.enable_unit_selection && unitOpts.length) {
                  setResponse(qId, { value: v, unit: currentUnit || defaultUnit });
                } else {
                  setResponse(qId, v);
                }
              };
              const increment = () => { const n = (isNaN(numVal) ? 0 : numVal) + 1; if (!maxVal || n <= maxVal) setNum(String(n)); };
              const decrement = () => { const n = (isNaN(numVal) ? 0 : numVal) - 1; if (!minVal || n >= minVal) setNum(String(n)); };
              return (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <TouchableOpacity onPress={decrement} style={styles.stepperBtn}><Text style={styles.stepperText}>−</Text></TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { minHeight: 44, width: 80, textAlign: 'center', marginBottom: 0 }]}
                      value={isNaN(numVal) ? '' : String(numVal)}
                      onChangeText={setNum}
                      placeholder={q.placeholder || '0'}
                      placeholderTextColor={COLORS.slate400}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={increment} style={styles.stepperBtn}><Text style={styles.stepperText}>+</Text></TouchableOpacity>
                    {/* Unit selector or static unit label */}
                    {q.enable_unit_selection && unitOpts.length > 1 ? (
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {unitOpts.map((u: any) => (
                          <TouchableOpacity
                            key={u.unit_code}
                            style={[styles.unitBtn, currentUnit === u.unit_code && styles.unitBtnActive]}
                            onPress={() => {
                              setResponse(qId, { value: typeof responses[qId] === 'object' ? responses[qId]?.value : responses[qId], unit: u.unit_code });
                            }}
                          >
                            <Text style={[styles.unitBtnText, currentUnit === u.unit_code && styles.unitBtnTextActive]}>{u.unit_symbol || u.unit_code}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : defaultUnit ? (
                      <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.slate500, fontWeight: '500' }}>{defaultUnit}</Text>
                    ) : null}
                  </View>
                  {(minVal || maxVal) ? (
                    <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: 4 }}>
                      {`Value must be between ${minVal || 0} and ${maxVal || '∞'}`}
                    </Text>
                  ) : null}
                </View>
              );
            })()}

            {/* Date */}
            {q.question_type === 'Date' && (
              Platform.OS === 'web' ? (
                <View style={[styles.datePickerBtn, { padding: 0, overflow: 'hidden' }]}>
                  {createElement('input', {
                    type: 'date',
                    value: responses[qId] || '',
                    onChange: (e: any) => setResponse(qId, e.target.value),
                    style: {
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 14, color: '#1e293b', padding: '12px',
                      width: '100%', height: '100%', cursor: 'pointer',
                    },
                  })}
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowDatePicker(qId)}
                  >
                    <Feather name="calendar" size={18} color={COLORS.slate400} />
                    <Text style={{ fontSize: FONT_SIZE.base, color: responses[qId] ? COLORS.slate800 : COLORS.slate400 }}>
                      {responses[qId]
                        ? new Date(responses[qId]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Select a date'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker === qId && (
                    <DateTimePicker
                      value={responses[qId] ? new Date(responses[qId]) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(null);
                        if (event.type === 'set' && selectedDate) {
                          const yyyy = selectedDate.getFullYear();
                          const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const dd = String(selectedDate.getDate()).padStart(2, '0');
                          setResponse(qId, `${yyyy}-${mm}-${dd}`);
                        }
                      }}
                    />
                  )}
                </View>
              )
            )}

            {/* File Upload */}
            {q.question_type === 'File Upload' && (
              uploadingFor === qId ? (
                <View style={styles.uploadBox}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: SPACING.sm }}>Uploading...</Text>
                </View>
              ) : responses[qId] ? (
                <View style={styles.uploadedBox}>
                  <Image source={{ uri: responses[qId].startsWith('/') ? `${API_BASE_URL}${responses[qId]}` : responses[qId] }} style={styles.uploadPreview} resizeMode="cover" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check-circle" size={14} color={COLORS.green} />
                    <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.green, fontWeight: '500', flex: 1 }}>File uploaded</Text>
                    <TouchableOpacity onPress={() => setResponse(qId, null)}>
                      <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.red }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: SPACING.sm }}>
                  <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(qId)}>
                    <Feather name="image" size={24} color={COLORS.slate400} />
                    <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.slate500 }}>Choose from Library</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.uploadBox} onPress={() => takePhoto(qId)}>
                      <Feather name="camera" size={24} color={COLORS.slate400} />
                      <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.slate500 }}>Take a Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )
            )}

            {/* Video Upload */}
            {q.question_type === 'Video Upload' && (
              uploadingFor === qId ? (
                <View style={styles.uploadBox}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: SPACING.sm }}>Uploading video...</Text>
                </View>
              ) : responses[qId] ? (
                <View style={styles.uploadedBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check-circle" size={14} color={COLORS.green} />
                    <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.green, fontWeight: '500', flex: 1 }}>Video uploaded</Text>
                    <TouchableOpacity onPress={() => setResponse(qId, null)}>
                      <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.red }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickVideo(qId)}>
                  <Feather name="video" size={24} color={COLORS.slate400} />
                  <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.slate500 }}>Choose Video from Library</Text>
                  <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.slate400 }}>Max 2 minutes</Text>
                </TouchableOpacity>
              )
            )}

            {/* Dropdown — same as Radio */}
            {q.question_type === 'Dropdown' && options.length > 0 && (
              <View style={styles.optionsCol}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionBtn, responses[qId] === opt.value && styles.optionSelected]}
                    onPress={() => setResponse(qId, opt.value)}
                  >
                    <Text style={[styles.optionText, responses[qId] === opt.value && styles.optionTextSelected]}>{stripHtml(opt.label)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(q.question_type === 'Yes/No' || q.question_type === 'Boolean') && (
              <View style={styles.yesNoRow}>
                {['Yes', 'No'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, responses[qId] === opt && styles.optionSelected]}
                    onPress={() => setResponse(qId, opt)}
                  >
                    <Text style={[styles.optionText, responses[qId] === opt && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {(q.question_type === 'Radio' || q.question_type === 'Select') && options.length > 0 && (
              <View style={styles.optionsCol}>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionBtn, responses[qId] === opt.value && styles.optionSelected]}
                    onPress={() => setResponse(qId, opt.value)}
                  >
                    <Text style={[styles.optionText, responses[qId] === opt.value && styles.optionTextSelected]}>{stripHtml(opt.label)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {q.question_type === 'Checkbox' && options.length > 0 && (
              <View style={styles.optionsCol}>
                {options.map((opt) => {
                  const selected = Array.isArray(responses[qId]) && responses[qId].includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionBtn, selected && styles.optionSelected]}
                      onPress={() => {
                        const current = Array.isArray(responses[qId]) ? [...responses[qId]] : [];
                        if (current.includes(opt.value)) {
                          setResponse(qId, current.filter((v: string) => v !== opt.value));
                        } else {
                          setResponse(qId, [...current, opt.value]);
                        }
                      }}
                    >
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{stripHtml(opt.label)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {q.warning_message && responses[qId] === q.warning_trigger_value && (
              <View style={styles.warning}>
                <Text style={styles.warningText}>{stripHtml(q.warning_message)}</Text>
              </View>
            )}
          </View>
        );
      })}

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
    <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: SPACING.xxl, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBanner: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  bookingInfoRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md,
    backgroundColor: COLORS.slate50, borderRadius: RADIUS.sm, padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookingInfoItem: { },
  bookingInfoLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  bookingInfoValue: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate800 },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  patientAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.white },
  patientName: { fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate800 },
  patientDob: { fontSize: FONT_SIZE.xs, color: COLORS.slate400 },
  progressBar: { height: 6, backgroundColor: COLORS.slate200, borderRadius: 3, marginBottom: SPACING.sm },
  progressFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 3 },
  progressText: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: SPACING.xxl },
  headingCard: {
    marginBottom: SPACING.xxl, backgroundColor: '#fef2f2', borderRadius: RADIUS.md,
    padding: SPACING.lg, borderWidth: 1, borderColor: '#fecaca',
  },
  headingTitle: { fontSize: FONT_SIZE.base, fontWeight: '700', color: '#dc2626', marginBottom: SPACING.sm },
  headingDesc: { fontSize: FONT_SIZE.sm, color: '#991b1b', lineHeight: 20 },
  headingCategory: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: SPACING.sm },
  textBlockCard: {
    marginBottom: SPACING.lg, backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.sm, padding: SPACING.lg,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  textBlockCategory: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.primary, marginBottom: 4 },
  textBlockText: { fontSize: FONT_SIZE.sm, color: COLORS.slate600, lineHeight: 20 },
  questionCard: { marginBottom: SPACING.xxl, paddingBottom: SPACING.xxl, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  questionNum: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.blue, marginBottom: 2 },
  categoryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: SPACING.xs },
  stepperBtn: {
    width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: COLORS.slate100,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.slate200,
  },
  stepperText: { fontSize: 18, fontWeight: '600', color: COLORS.slate600 },
  unitBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.slate200, backgroundColor: COLORS.white,
  },
  unitBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitBtnText: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate500 },
  unitBtnTextActive: { color: COLORS.white },
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
  uploadBox: {
    backgroundColor: COLORS.slate50, borderRadius: RADIUS.sm, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.slate200, borderStyle: 'dashed',
    alignItems: 'center', gap: SPACING.sm,
  },
  uploadedBox: {
    backgroundColor: COLORS.greenBg, borderRadius: RADIUS.sm, padding: SPACING.md,
    gap: SPACING.sm, borderWidth: 1, borderColor: '#bbf7d0',
  },
  uploadPreview: { width: '100%', height: 160, borderRadius: RADIUS.sm },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.sm,
    padding: SPACING.md, minHeight: 44,
  },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.lg,
  },
  submitText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '600' },
});
