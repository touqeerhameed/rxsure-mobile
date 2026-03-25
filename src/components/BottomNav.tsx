import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const tabs = [
  { name: 'Home', icon: 'home' as const, path: '/(tabs)/home' },
  { name: 'Services', icon: 'list' as const, path: '/(tabs)/services' },
  { name: 'Bookings', icon: 'calendar' as const, path: '/(tabs)/bookings' },
  { name: 'Profile', icon: 'user' as const, path: '/(tabs)/profile' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.path.replace('/(tabs)', ''));
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.replace(tab.path as any)}
            activeOpacity={0.7}
          >
            <Feather name={tab.icon} size={22} color={isActive ? COLORS.primary : COLORS.slate400} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  labelActive: {
    color: COLORS.primary,
  },
});
