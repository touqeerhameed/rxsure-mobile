import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { submitSupportTicket, uploadTicketFile } from '../../src/api/services';
import PrivateImage from '../../src/components/PrivateImage';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/utils/constants';
import BottomNav from '../../src/components/BottomNav';

const CATEGORIES = [
  { value: 'TECHNICAL_BUG', label: 'Technical Issue' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'GENERAL', label: 'General' },
  { value: 'POLICY', label: 'Policy' },
];

export default function SubmitTicketScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<{ file_name: string; file_url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickAttachment = async () => {
    if (attachments.length >= 5) { setError('Maximum 5 attachments allowed'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const asset = result.assets[0];
        const res = await uploadTicketFile(token!, asset.base64 || '', asset.fileName || `attachment_${Date.now()}.jpg`) as any;
        const fileUrl = res?.file_url || '';
        if (fileUrl) {
          setAttachments(prev => [...prev, { file_name: asset.fileName || 'attachment.jpg', file_url: fileUrl }]);
        } else {
          setError('Failed to upload file');
        }
      } catch { setError('Failed to upload attachment'); }
      finally { setUploading(false); }
    }
  };

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!category || !subject.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (!token) return;
    setError('');
    setSubmitting(true);
    try {
      // Only include server-uploaded attachments (not blob: URLs)
      const serverAttachments = attachments.filter(a => a.file_url && !a.file_url.startsWith('blob:'));
      const result = await submitSupportTicket(token, {
        category, subject: subject.trim(), description: description.trim(),
        ...(serverAttachments.length > 0 ? { attachments: JSON.stringify(serverAttachments) } : {}),
      } as any);
      setTicketId((result as any)?.ticket_id || (result as any)?.name || '');
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={56} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Ticket Submitted!</Text>
          {ticketId ? (
            <Text style={styles.successTicketId}>Ticket ID: {ticketId}</Text>
          ) : null}
          <Text style={styles.successDesc}>
            We'll get back to you as soon as possible. You can track your ticket status from the tickets list.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.replace('/help/tickets')}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>View My Tickets</Text>
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
          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.radioGroup}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.radioItem, category === cat.value && styles.radioItemActive]}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, category === cat.value && styles.radioOuterActive]}>
                  {category === cat.value && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, category === cat.value && styles.radioLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your issue"
            placeholderTextColor={COLORS.slate400}
            value={subject}
            onChangeText={setSubject}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={COLORS.slate400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Attachments */}
          <Text style={styles.label}>Attachments (optional)</Text>
          <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: SPACING.sm }}>Up to 5 images. JPG, PNG supported.</Text>
          {attachments.length > 0 && (
            <View style={styles.attachmentGrid}>
              {attachments.map((att, i) => (
                <View key={i} style={styles.attachmentItem}>
                  <PrivateImage fileUrl={att.file_url || ''} fileName={att.file_name} style={{ width: 72, height: 72 }} />
                  <TouchableOpacity style={styles.attachmentRemove} onPress={() => removeAttachment(i)}>
                    <Feather name="x" size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.attachButton} onPress={pickAttachment} disabled={uploading || attachments.length >= 5}>
            {uploading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
              <>
                <Feather name="paperclip" size={16} color={COLORS.primary} />
                <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' }}>Add Attachment</Text>
              </>
            )}
          </TouchableOpacity>

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
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
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
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  attachmentItem: { position: 'relative' },
  attachmentThumb: { width: 72, height: 72, borderRadius: RADIUS.sm },
  attachmentRemove: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center',
  },
  attachButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md,
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
  successTicketId: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: COLORS.primary,
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
