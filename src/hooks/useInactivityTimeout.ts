import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useInactivityTimeout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  const { isAuthenticated, logout, setOrganization } = useAuthStore();

  const resetTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => {
        // Auto-logout after inactivity
        logout().then(() => {
          setOrganization('');
        });
      }, TIMEOUT_MS);
    }
  }, [isAuthenticated, logout, setOrganization]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Start timer
    resetTimer();

    // Listen for app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        // App came to foreground — check if timeout elapsed
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed >= TIMEOUT_MS) {
          logout().then(() => setOrganization(''));
        } else {
          resetTimer();
        }
      } else if (state === 'background') {
        // App went to background — record time
        lastActiveRef.current = Date.now();
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      subscription.remove();
    };
  }, [isAuthenticated, resetTimer]);

  return { resetTimer };
}
