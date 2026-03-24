import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  services: {
    all: ['services'] as const,
    detail: (id: string) => ['services', id] as const,
    slots: (serviceId: string, date: string) => ['services', serviceId, 'slots', date] as const,
    slotsByCode: (code: string, date: string, businessId: string) =>
      ['services', 'byCode', code, 'slots', date, businessId] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    list: (filters?: Record<string, unknown>) => ['bookings', 'list', filters] as const,
    detail: (id: string) => ['bookings', id] as const,
    confirmation: (id: string) => ['bookings', 'confirmation', id] as const,
  },
  profile: {
    current: ['profile'] as const,
  },
  questionnaires: {
    detail: (id: string) => ['questionnaires', id] as const,
    preScreening: (bookingId: string) => ['questionnaires', 'preScreening', bookingId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
} as const;
