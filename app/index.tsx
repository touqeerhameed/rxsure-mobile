import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const organization = useAuthStore((s) => s.organization);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  // If no pharmacy selected, go to pharmacy selection first
  if (!organization) {
    return <Redirect href="/select-pharmacy" />;
  }

  return <Redirect href="/login" />;
}
