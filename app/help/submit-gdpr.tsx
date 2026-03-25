import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { submitGDPRRequest, uploadTicketFile } from '../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';
import PrivateImage from '../../src/components/PrivateImage';

const REQUEST_TYPES = [
  { value: 'SAR', label: 'Subject Access Request (SAR)', desc: 'Request a copy of all personal data we hold about you' },
  { value: 'DELETION', label: 'Data Deletion', desc: 'Request deletion of your personal data (right to be forgotten)' },
  { value: 'PORTABILITY', label: 'Data Portability', desc: 'Receive your data in a portable, machine-readable format' },
  { value: 'RECTIFICATION', label: 'Data Rectification', desc: 'Correct inaccurate or incomplete personal data' },
  { value: 'OBJECTION', label: 'Right to Object', desc: 'Object to the processing of your personal data' },
];

export default function SubmitGDPRScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [requestType, setRequestType] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [idDocument, setIdDocument] = useState<{ file_name: string; file_url: string } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const pickIdDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0]) {
      setUploadingDoc(true);
      try {
        const asset = result.assets[0];
        const res = await uploadTicketFile(token!, asset.base64 || '', asset.fileName || `id_doc_${Date.now()}.jpg`) as any;
        const fileUrl = res?.file_url || '';
        if (fileUrl) {
          setIdDocument({ file_name: asset.fileName || 'id_document.jpg', file_url: fileUrl });
        } else {
          setError('Failed to upload document');
        }
      } catch { setError('Failed to upload document'); }
      finally { setUploadingDoc(false); }
    }
  };

  const handleSubmit = async () => {
    if (!requestType) {
      setError('Please select a request type');
      return;
    }
    if (!token) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await submitGDPRRequest(token, {
        request_type: requestType,
        details: details.trim() || undefined,
        ...(idDocument ? { verification_document: idDocument.file_url } : {}),
      } as any);
      setReferenceNumber((result as any)?.reference_number || (result as any)?.name || '');
      setDeadline((result as any)?.deadline || '');
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (success) {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={56} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          {referenceNumber ? (
            <Text style={styles.successRef}>Reference: {referenceNumber}</Text>
          ) : null}
          {deadline ? (
            <View style={styles.deadlineBox}>
              <Feather name="clock" size={16} color={COLORS.amber} />
              <Text style={styles.deadlineText}>Deadline: {formatDate(deadline)}</Text>
            </View>
          ) : null}
          <Text style={styles.successDesc}>
            Your data request has been submitted and will be processed within the legal timeframe. You will be notified of any updates.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.replace('/help/gdpr')}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>View My Requests</Text>
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
          {/* Request Type */}
          <Text style={styles.label}>Request Type</Text>
          <View style={styles.radioGroup}>
            {REQUEST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.radioItem, requestType === type.value && styles.radioItemActive]}
                onPress={() => setRequestType(type.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, requestType === type.value && styles.radioOuterActive]}>
                  {requestType === type.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, requestType === type.value && styles.radioLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Details */}
          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe what data you need..."
            placeholderTextColor={COLORS.slate400}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* ID Document Upload */}
          <Text style={styles.label}>ID Document (optional)</Text>
          <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: SPACING.sm }}>Upload passport or driving licence for identity verification</Text>
          {idDocument ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm }}>
              <PrivateImage fileUrl={idDocument.file_url} fileName={idDocument.file_name} style={{ width: 72, height: 72 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.green, fontWeight: '500' }}>Document uploaded</Text>
                <TouchableOpacity onPress={() => setIdDocument(null)}>
                  <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.red, marginTop: 4 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
                borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: RADIUS.sm, paddingVertical: SPACING.md }}
              onPress={pickIdDocument}
              disabled={uploadingDoc}
            >
              {uploadingDoc ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                <>
                  <Feather name="upload" size={16} color={COLORS.primary} />
                  <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' }}>Upload ID Document</Text>
                </>
              )}
            </TouchableOpacity>
          )}

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
              <Text style={styles.submitButtonText}>Submit Request</Text>
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
    flex: 1,
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
    marginBottom: SPACING.sm,
  },
  successRef: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.amberBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  deadlineText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.amber,
  },
  successDesc: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
});
