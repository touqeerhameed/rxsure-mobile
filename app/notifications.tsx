import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../src/api/services';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../src/utils/constants';
import BottomNav from '../src/components/BottomNav';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'gdpr', label: 'Privacy' },
];

function getCategoryForType(type: string): string {
  if (['BOOKING_CONFIRMED', 'BOOKING_REMINDER', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED', 'QUESTIONNAIRE_DUE', 'PRESCREENING_DUE'].includes(type)) return 'bookings';
  if (['TICKET_NEW', 'TICKET_REPLY', 'TICKET_STATUS'].includes(type)) return 'tickets';
  if (['GDPR_SUBMITTED', 'GDPR_STATUS', 'GDPR_DEADLINE'].includes(type)) return 'gdpr';
  return 'general';
}

function getIconForType(type: string): { name: FeatherIcon; color: string } {
  switch (type) {
    case 'BOOKING_CONFIRMED':
      return { name: 'check-circle', color: COLORS.primary };
    case 'BOOKING_REMINDER':
      return { name: 'clock', color: '#3b82f6' };
    case 'BOOKING_CANCELLED':
      return { name: 'x-circle', color: COLORS.red };
    case 'BOOKING_RESCHEDULED':
      return { name: 'calendar', color: COLORS.primary };
    case 'QUESTIONNAIRE_DUE':
    case 'PRESCREENING_DUE':
      return { name: 'clipboard', color: COLORS.amber };
    case 'TICKET_NEW':
      return { name: 'tag', color: '#3b82f6' };
    case 'TICKET_REPLY':
      return { name: 'message-square', color: COLORS.primary };
    case 'TICKET_STATUS':
      return { name: 'check-circle', color: COLORS.green };
    case 'GDPR_SUBMITTED':
      return { name: 'shield', color: '#7c3aed' };
    case 'GDPR_STATUS':
      return { name: 'shield', color: COLORS.green };
    case 'GDPR_DEADLINE':
      return { name: 'alert-triangle', color: COLORS.amber };
    case 'FEEDBACK_REVIEWED':
      return { name: 'star', color: '#f59e0b' };
    default:
      return { name: 'bell', color: COLORS.slate400 };
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getNotifications(token);
      const list = result?.notifications || (Array.isArray(result) ? result : []);
      setNotifications(list);
      setUnreadCount(result?.unread_count ?? list.filter((n: any) => !n.is_read).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkRead = async (notificationId: string) => {
    if (!token) return;
    try {
      await markNotificationRead(token, notificationId);
      setNotifications(prev =>
        prev.map(n => n.name === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.is_read) {
      handleMarkRead(notification.name);
    }
    if (notification.link) {
      router.push(notification.link as any);
    }
  };

  const filteredNotifications = categoryFilter === 'all'
    ? notifications
    : notifications.filter(n => getCategoryForType(n.notification_type) === categoryFilter);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Subtitle */}
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <Feather name="check" size={14} color={COLORS.primary} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {CATEGORY_FILTERS.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterPill,
                categoryFilter === cat.key && styles.filterPillActive,
              ]}
              onPress={() => setCategoryFilter(cat.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  categoryFilter === cat.key && styles.filterPillTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={48} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyDesc}>
              {categoryFilter !== 'all'
                ? `No ${categoryFilter} notifications`
                : 'You have no notifications yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filteredNotifications.map((notification: any, index: number) => {
              const icon = getIconForType(notification.notification_type);
              const isLast = index === filteredNotifications.length - 1;

              return (
                <TouchableOpacity
                  key={notification.name}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.notificationUnread,
                    !isLast && styles.notificationBorder,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationIcon}>
                    <Feather name={icon.name} size={18} color={icon.color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          !notification.is_read && styles.notificationTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      <View style={styles.notificationRight}>
                        {!notification.is_read && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                    </View>
                    {notification.message && (
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                    )}
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.creation)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50 },
  content: { padding: SPACING.lg, paddingBottom: 80 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate500,
  },
  markAllButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm, backgroundColor: COLORS.primaryBg,
  },
  markAllText: {
    fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.primary,
  },

  filterScroll: { marginBottom: SPACING.lg },
  filterRow: { gap: SPACING.sm },
  filterPill: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.slate200,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate500,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },

  listCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row', padding: SPACING.lg, gap: SPACING.md,
  },
  notificationUnread: {
    backgroundColor: '#f0fdfa',
  },
  notificationBorder: {
    borderBottomWidth: 1, borderBottomColor: COLORS.slate100,
  },
  notificationIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.slate50,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  notificationContent: { flex: 1 },
  notificationTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: SPACING.sm,
  },
  notificationTitle: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: COLORS.slate500,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700', color: COLORS.slate800,
  },
  notificationRight: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate500, marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: FONT_SIZE.xs, color: COLORS.slate400, marginTop: SPACING.sm,
  },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.slate600,
    marginTop: SPACING.lg,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm, color: COLORS.slate400,
    marginTop: SPACING.xs, textAlign: 'center',
  },
});
