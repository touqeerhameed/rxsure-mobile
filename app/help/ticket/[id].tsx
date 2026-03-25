import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/store/authStore';
import { getTicketDetail, replyToTicket, markTicketResolved, uploadTicketFile } from '../../../src/api/services';
import PrivateImage from '../../../src/components/PrivateImage';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../../src/utils/constants';
import BottomNav from '../../../src/components/BottomNav';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: '#dbeafe', text: '#2563eb' },
  IN_PROGRESS: { bg: COLORS.amberBg, text: COLORS.amber },
  WAITING: { bg: '#fef3c7', text: '#b45309' },
  RESOLVED: { bg: COLORS.greenBg, text: COLORS.green },
  CLOSED: { bg: COLORS.slate100, text: COLORS.slate500 },
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Awaiting Response',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING: 'Booking Issue',
  TECHNICAL: 'Technical Issue',
  ACCOUNT: 'Account & Profile',
  PRESCRIPTION: 'Prescription',
  BILLING: 'Billing',
  GENERAL: 'General Inquiry',
  FEEDBACK: 'Feedback',
  OTHER: 'Other',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<{ file_name: string; file_url: string }[]>([]);
  const [uploadingAtt, setUploadingAtt] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [resolving, setResolving] = useState(false);
  const { patient } = useAuthStore();

  const pickReplyAttachment = async () => {
    if (replyAttachments.length >= 3) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0]) {
      setUploadingAtt(true);
      try {
        const asset = result.assets[0];
        const res = await uploadTicketFile(token!, asset.base64 || '', asset.fileName || `reply_${Date.now()}.jpg`, id) as any;
        const fileUrl = res?.file_url || '';
        setReplyAttachments(prev => [...prev, { file_name: asset.fileName || 'attachment.jpg', file_url: fileUrl }]);
      } catch {}
      finally { setUploadingAtt(false); }
    }
  };

  const loadTicket = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const result = await getTicketDetail(token, id);
      setTicket(result?.ticket || result);
      setMessages(result?.messages || []);
    } catch (e: any) {
      console.error('Failed to load ticket:', e);
      setError(e.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [messages]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTicket();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !token || !id) return;
    setSendingReply(true);
    try {
      const serverAtts = replyAttachments.filter(a => a.file_url && !a.file_url.startsWith('blob:'));
      const result = await replyToTicket(token, id, replyText.trim(), serverAtts.length > 0 ? serverAtts : undefined);
      if (result?.success !== false) {
        setReplyText('');
        setReplyAttachments([]);
        await loadTicket();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!token || !id) return;
    setResolving(true);
    try {
      const result = await markTicketResolved(token, id);
      if (result?.success !== false) {
        await loadTicket();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to resolve ticket');
    } finally {
      setResolving(false);
    }
  };

  const canReply = ticket && !['RESOLVED', 'CLOSED'].includes(ticket.status);
  const canResolve = ticket && !['RESOLVED', 'CLOSED'].includes(ticket.status);

  if (loading) {
    return (
      <>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <BottomNav />
      </>
    );
  }

  if (error && !ticket) {
    return (
      <>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTicket}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </>
    );
  }

  const statusStyle = STATUS_COLORS[ticket?.status] || STATUS_COLORS.NEW;

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={14} color={COLORS.red} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Header Card */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.ticketIdBadge}>
                <Text style={styles.ticketIdText}>{ticket.ticket_id || ticket.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </Text>
              </View>
            </View>
            <Text style={styles.subject}>{ticket.subject}</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>
                  {CATEGORY_LABELS[ticket.category] || ticket.category || 'General'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Submitted</Text>
                <Text style={styles.infoValue}>{formatDate(ticket.creation)}</Text>
              </View>
            </View>
          </View>

          {/* Original Description */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Original Request</Text>
            <Text style={styles.descriptionText}>{ticket.description}</Text>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <View style={styles.attachmentSection}>
                <Text style={styles.attachmentLabel}>
                  <Feather name="paperclip" size={12} color={COLORS.slate400} /> Attachments ({ticket.attachments.length})
                </Text>
                <View style={styles.attachmentGrid}>
                  {ticket.attachments.map((att: any, i: number) => (
                    <PrivateImage
                      key={i}
                      fileUrl={att.file_url || ''}
                      fileName={att.file_name}
                      style={styles.attachmentThumb}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Conversation */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Conversation</Text>
            {messages.length === 0 ? (
              <Text style={styles.emptyMessages}>No messages yet</Text>
            ) : (
              messages.map((msg: any) => {
                const isUser = msg.sender_type === 'USER';
                const isSystem = msg.sender_type === 'SYSTEM';

                if (isSystem) {
                  return (
                    <View key={msg.name} style={styles.systemMessageContainer}>
                      <Text style={styles.systemMessage}>{msg.message}</Text>
                      <Text style={styles.systemTimestamp}>{formatDate(msg.creation)}</Text>
                    </View>
                  );
                }

                return (
                  <View
                    key={msg.name}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowRight : styles.messageRowLeft,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.agentBubble,
                      ]}
                    >
                      {!isUser && (
                        <Text style={styles.senderName}>
                          {msg.sender_name || 'Support'}
                        </Text>
                      )}
                      <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                        {msg.message}
                      </Text>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <View style={styles.msgAttGrid}>
                          {msg.attachments.map((att: any, ai: number) => (
                            <PrivateImage
                              key={ai}
                              fileUrl={att.file_url || ''}
                              fileName={att.file_name}
                              style={{ width: 120, height: 90, borderRadius: 6, marginTop: 6 }}
                            />
                          ))}
                        </View>
                      )}
                      <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
                        {formatDate(msg.creation)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Reply Input */}
          {canReply && (
            <View style={styles.card}>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your reply..."
                placeholderTextColor={COLORS.slate400}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {/* Reply Attachments */}
              {replyAttachments.length > 0 && (
                <View style={styles.replyAttGrid}>
                  {replyAttachments.map((att, i) => (
                    <View key={i} style={{ position: 'relative' }}>
                      <PrivateImage fileUrl={att.file_url} fileName={att.file_name} style={styles.replyAttThumb} />
                      <TouchableOpacity style={styles.replyAttRemove} onPress={() => setReplyAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                        <Feather name="x" size={12} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={pickReplyAttachment}
                  disabled={uploadingAtt || replyAttachments.length >= 3}
                  activeOpacity={0.7}
                >
                  {uploadingAtt ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Feather name="paperclip" size={18} color={replyAttachments.length >= 3 ? COLORS.slate300 : COLORS.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!replyText.trim() || sendingReply) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  activeOpacity={0.7}
                >
                  {sendingReply ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Feather name="send" size={16} color={COLORS.white} />
                      <Text style={styles.sendButtonText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 10, color: COLORS.slate400, marginTop: 4 }}>Up to 3 images</Text>
            </View>
          )}

          {/* Mark as Resolved */}
          {canResolve && (
            <View style={styles.resolveCard}>
              <Feather name="check-circle" size={20} color={COLORS.green} />
              <View style={styles.resolveContent}>
                <Text style={styles.resolveTitle}>Issue resolved?</Text>
                <Text style={styles.resolveDesc}>
                  If your issue has been resolved, you can close this ticket.
                </Text>
                <TouchableOpacity
                  style={[styles.resolveButton, resolving && { opacity: 0.6 }]}
                  onPress={handleMarkResolved}
                  disabled={resolving}
                  activeOpacity={0.7}
                >
                  {resolving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 80 },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.slate50,
  },
  errorContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.slate50, padding: SPACING.xxl,
  },
  errorText: {
    fontSize: FONT_SIZE.base, color: COLORS.red,
    textAlign: 'center', marginTop: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.redBg, borderRadius: RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  errorBannerText: { fontSize: FONT_SIZE.sm, color: COLORS.red, flex: 1 },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  ticketIdBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  ticketIdText: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  subject: {
    fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.slate800,
    marginBottom: SPACING.md,
  },
  infoGrid: { flexDirection: 'row', gap: SPACING.lg },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate700,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate400,
    marginBottom: SPACING.md,
  },
  descriptionText: {
    fontSize: FONT_SIZE.base, color: COLORS.slate700, lineHeight: 22,
  },
  attachmentSection: { marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.slate100 },
  attachmentLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate400, marginBottom: SPACING.sm },
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  attachmentThumb: { width: 80, height: 80, borderRadius: RADIUS.sm },
  attachmentFile: {
    width: 80, height: 80, borderRadius: RADIUS.sm, backgroundColor: COLORS.slate50,
    borderWidth: 1, borderColor: COLORS.slate200, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  attachmentFileName: { fontSize: 9, color: COLORS.slate500, textAlign: 'center', paddingHorizontal: 4 },
  emptyMessages: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate400,
    textAlign: 'center', paddingVertical: SPACING.xxl,
  },

  // Messages
  messageRow: { marginBottom: SPACING.md },
  messageRowRight: { alignItems: 'flex-end' },
  messageRowLeft: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%', borderRadius: RADIUS.md, padding: SPACING.md,
  },
  userBubble: { backgroundColor: COLORS.primary },
  agentBubble: { backgroundColor: COLORS.slate100 },
  senderName: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate500,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate700, lineHeight: 20,
  },
  userMessageText: { color: COLORS.white },
  msgAttGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  messageTime: {
    fontSize: 10, color: COLORS.slate400, marginTop: 4,
  },
  userMessageTime: { color: 'rgba(255,255,255,0.7)' },

  // System message
  systemMessageContainer: {
    alignItems: 'center', marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  systemMessage: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, fontStyle: 'italic',
    textAlign: 'center',
  },
  systemTimestamp: {
    fontSize: 10, color: COLORS.slate300, marginTop: 2,
  },

  // Reply input
  replyInput: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: RADIUS.sm,
    padding: SPACING.md, fontSize: FONT_SIZE.base, color: COLORS.slate700,
    minHeight: 80, marginBottom: SPACING.md,
  },
  replyAttGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  replyAttThumb: { width: 60, height: 60, borderRadius: RADIUS.sm },
  replyAttRemove: {
    position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center',
  },
  replyActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  attachBtn: { padding: SPACING.sm },
  sendButton: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: {
    fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.white,
  },

  // Resolve
  resolveCard: {
    backgroundColor: COLORS.greenBg, borderRadius: RADIUS.md,
    padding: SPACING.lg, flexDirection: 'row', gap: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: '#bbf7d0',
  },
  resolveContent: { flex: 1 },
  resolveTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#166534',
    marginBottom: 4,
  },
  resolveDesc: {
    fontSize: FONT_SIZE.sm, color: '#15803d', marginBottom: SPACING.md,
    lineHeight: 20,
  },
  resolveButton: {
    backgroundColor: COLORS.green, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    alignItems: 'center', alignSelf: 'flex-start',
  },
  resolveButtonText: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.white,
  },
});
