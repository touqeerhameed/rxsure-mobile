import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../../src/store/authStore';
import { getGDPRRequestDetail } from '../../../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../../src/utils/constants';
import PrivateImage from '../../../src/components/PrivateImage';
import BottomNav from '../../../src/components/BottomNav';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  SUBMITTED: { bg: '#dbeafe', text: '#2563eb' },
  VERIFYING: { bg: COLORS.amberBg, text: COLORS.amber },
  PROCESSING: { bg: '#ede9fe', text: '#7c3aed' },
  COMPLETED: { bg: COLORS.greenBg, text: COLORS.green },
  REFUSED: { bg: COLORS.redBg, text: COLORS.red },
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  VERIFYING: 'Verifying Identity',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  REFUSED: 'Refused',
};

const TYPE_LABELS: Record<string, string> = {
  SAR: 'Subject Access Request',
  DATA_DELETION: 'Data Deletion',
  DATA_PORTABILITY: 'Data Portability',
  DATA_RECTIFICATION: 'Data Rectification',
  RIGHT_TO_OBJECT: 'Right to Object',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function getDaysRemaining(deadline: string): number {
  if (!deadline) return 0;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface TimelineStep {
  label: string;
  description: string;
  dotColor: string;
  show: boolean;
}

export default function GDPRDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();

  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    if (!token || !id) return;
    try {
      setError(null);
      const result = await getGDPRRequestDetail(token, id);
      setRequest(result?.request || result);
    } catch (e: any) {
      console.error('Failed to load GDPR request:', e);
      setError(e.message || 'Failed to load request');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequest();
  };

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

  if (error && !request) {
    return (
      <>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequest}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </>
    );
  }

  const statusStyle = STATUS_COLORS[request?.status] || STATUS_COLORS.SUBMITTED;
  const daysLeft = request?.days_until_deadline ?? getDaysRemaining(request?.deadline);
  const needsVerification = request?.status === 'VERIFYING' && !request?.identity_verified;

  const timelineSteps: TimelineStep[] = [
    {
      label: 'Request Submitted',
      description: formatDate(request.creation),
      dotColor: '#3b82f6',
      show: true,
    },
    {
      label: 'Identity Verified',
      description: request.identity_verified ? 'Your identity has been confirmed' : 'Pending verification',
      dotColor: request.identity_verified ? COLORS.green : COLORS.slate300,
      show: request.identity_verified || request.status === 'VERIFYING',
    },
    {
      label: 'Processing',
      description: 'Your request is being processed',
      dotColor: '#7c3aed',
      show: request.status === 'PROCESSING' || request.status === 'COMPLETED' || request.status === 'REFUSED',
    },
    {
      label: request.status === 'REFUSED' ? 'Refused' : 'Completed',
      description: request.completed_at ? formatDate(request.completed_at) : '',
      dotColor: request.status === 'COMPLETED' ? COLORS.green : request.status === 'REFUSED' ? COLORS.red : COLORS.slate300,
      show: !!request.completed_at,
    },
  ];

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.refBadge}>
              <Feather name="hash" size={12} color={COLORS.primary} />
              <Text style={styles.refText}>{request.reference_number || request.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {STATUS_LABELS[request.status] || request.status}
              </Text>
            </View>
          </View>
          <Text style={styles.requestType}>
            {TYPE_LABELS[request.request_type] || request.request_type}
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Submitted</Text>
              <Text style={styles.infoValue}>{formatDate(request.creation)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Deadline</Text>
              <Text style={styles.infoValue}>
                {formatDate(request.deadline)}
              </Text>
              {daysLeft > 0 && request.status !== 'COMPLETED' && request.status !== 'REFUSED' && (
                <Text style={styles.daysLeft}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                </Text>
              )}
            </View>
          </View>
          {request.completed_at && (
            <View style={[styles.infoItem, { marginTop: SPACING.md }]}>
              <Text style={styles.infoLabel}>Completed</Text>
              <Text style={styles.infoValue}>{formatDate(request.completed_at)}</Text>
            </View>
          )}
          <View style={[styles.infoItem, { marginTop: SPACING.md }]}>
            <Text style={styles.infoLabel}>Identity Verified</Text>
            {request.identity_verified ? (
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={14} color={COLORS.green} />
                <Text style={[styles.infoValue, { color: COLORS.green }]}>Verified</Text>
              </View>
            ) : (
              <Text style={[styles.infoValue, { color: COLORS.amber }]}>Pending</Text>
            )}
          </View>
        </View>

        {/* Identity Verification Warning */}
        {needsVerification && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Feather name="alert-triangle" size={18} color={COLORS.amber} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Identity Verification Required</Text>
                <Text style={styles.warningDesc}>
                  Please upload a copy of your ID (passport or driving licence) to verify your identity.
                  This is required before we can process your request.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Request Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Request Details</Text>
          <Text style={styles.detailsText}>
            {request.details || 'No additional details provided.'}
          </Text>

          {/* Verification Document */}
          {request.verification_document && (
            <View style={{ marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.slate100 }}>
              <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate400, marginBottom: SPACING.sm }}>ID Document</Text>
              <PrivateImage
                fileUrl={request.verification_document}
                fileName="ID Document"
                style={{ width: 120, height: 90 }}
              />
            </View>
          )}

          {/* Other Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <View style={{ marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.slate100 }}>
              <Text style={{ fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.slate400, marginBottom: SPACING.sm }}>
                Attachments ({request.attachments.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
                {request.attachments.map((att: any, i: number) => (
                  <PrivateImage
                    key={i}
                    fileUrl={att.file_url || ''}
                    fileName={att.file_name}
                    style={{ width: 80, height: 80 }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Refusal Reason */}
        {request.status === 'REFUSED' && request.refusal_reason && (
          <View style={styles.refusalCard}>
            <Feather name="x-circle" size={18} color={COLORS.red} />
            <View style={styles.refusalContent}>
              <Text style={styles.refusalTitle}>Request Refused</Text>
              <Text style={styles.refusalText}>{request.refusal_reason}</Text>
            </View>
          </View>
        )}

        {/* Data Package Download */}
        {request.status === 'COMPLETED' && request.data_package_path && (
          <View style={styles.dataPackageCard}>
            <Feather name="check-circle" size={18} color={COLORS.green} />
            <View style={styles.dataPackageContent}>
              <Text style={styles.dataPackageTitle}>Your Data Package is Ready</Text>
              <Text style={styles.dataPackageDesc}>
                Your requested data is available for download.
                {request.data_package_expires && (
                  ` This link expires on ${formatDate(request.data_package_expires)}.`
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Request Timeline</Text>
          {timelineSteps
            .filter(step => step.show)
            .map((step, index, arr) => (
              <View key={step.label} style={styles.timelineItem}>
                <View style={styles.timelineDotCol}>
                  <View style={[styles.timelineDot, { backgroundColor: step.dotColor }]} />
                  {index < arr.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>{step.label}</Text>
                  {step.description ? (
                    <Text style={styles.timelineDesc}>{step.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
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

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  refBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  refText: {
    fontSize: FONT_SIZE.xs, fontWeight: '600', color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  requestType: {
    fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.slate800,
  },

  infoGrid: { flexDirection: 'row', gap: SPACING.lg },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate700,
  },
  daysLeft: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },

  // Warning
  warningCard: {
    backgroundColor: COLORS.amberBg, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#fde68a',
  },
  warningHeader: {
    flexDirection: 'row', gap: SPACING.md,
  },
  warningContent: { flex: 1 },
  warningTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#92400e',
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: FONT_SIZE.sm, color: '#a16207', lineHeight: 20,
  },

  // Request Details
  sectionLabel: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.slate400,
    marginBottom: SPACING.md,
  },
  detailsText: {
    fontSize: FONT_SIZE.base, color: COLORS.slate700, lineHeight: 22,
  },

  // Refusal
  refusalCard: {
    backgroundColor: COLORS.redBg, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    flexDirection: 'row', gap: SPACING.md,
    borderWidth: 1, borderColor: '#fecaca',
  },
  refusalContent: { flex: 1 },
  refusalTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#991b1b',
    marginBottom: 4,
  },
  refusalText: {
    fontSize: FONT_SIZE.sm, color: '#b91c1c', lineHeight: 20,
  },

  // Data Package
  dataPackageCard: {
    backgroundColor: COLORS.greenBg, borderRadius: RADIUS.md,
    padding: SPACING.lg, marginBottom: SPACING.md,
    flexDirection: 'row', gap: SPACING.md,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  dataPackageContent: { flex: 1 },
  dataPackageTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#166534',
    marginBottom: 4,
  },
  dataPackageDesc: {
    fontSize: FONT_SIZE.sm, color: '#15803d', lineHeight: 20,
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row', marginBottom: SPACING.lg,
  },
  timelineDotCol: {
    alignItems: 'center', width: 24, marginRight: SPACING.md,
  },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5, marginTop: 4,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: COLORS.slate200,
    marginTop: 4,
  },
  timelineContent: { flex: 1 },
  timelineLabel: {
    fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate700,
  },
  timelineDesc: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate400, marginTop: 2,
  },
});
