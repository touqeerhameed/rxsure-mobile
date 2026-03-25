import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useBiometric } from '../src/hooks/useBiometric';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const organization = useAuthStore((s) => s.organization);
  const setOrganization = useAuthStore((s) => s.setOrganization);
  const { getStoredOrganization } = useBiometric();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // If no organization but biometric has one stored, restore it
    if (!organization) {
      getStoredOrganization().then((storedOrg) => {
        if (storedOrg) setOrganization(storedOrg);
        setChecked(true);
      });
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  // If no pharmacy selected, go to pharmacy selection first
  if (!organization) {
    return <Redirect href="/select-pharmacy" />;
  }

  return <Redirect href="/login" />;
}
