export function formatPatientName(
  firstName?: string,
  middleName?: string | null,
  lastName?: string
): string {
  const parts: string[] = [];
  if (firstName) parts.push(firstName);
  if (middleName) parts.push(middleName);
  if (lastName) parts.push(lastName);
  return parts.join(' ');
}

export function getPatientInitials(
  firstName?: string,
  lastName?: string
): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(timeStr)}`;
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return '#16a34a';
    case 'pending':
    case 'scheduled':
      return '#d97706';
    case 'cancelled':
      return '#dc2626';
    case 'rescheduled':
      return '#2563eb';
    default:
      return '#64748b';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return '#f0fdf4';
    case 'pending':
    case 'scheduled':
      return '#fffbeb';
    case 'cancelled':
      return '#fef2f2';
    case 'rescheduled':
      return '#eff6ff';
    default:
      return '#f8fafc';
  }
}
