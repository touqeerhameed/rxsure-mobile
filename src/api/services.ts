import { frappeClient } from './client';
import type { Service, TimeSlot, Booking, Questionnaire, Branding } from '../types';

const API = 'consultation.consultation.api.patient_api';

// ─── Services ────────────────────────────────────────────
export async function getServices(businessId: string): Promise<Service[]> {
  return frappeClient.call(`${API}.get_services`, { business_id: businessId });
}

export async function getService(serviceId: string, businessId: string): Promise<Service> {
  const result = await frappeClient.call(`${API}.get_service`, { service_id: serviceId, business_id: businessId });
  return (result as any)?.service || result;
}

export async function getAvailableSlots(serviceId: string, date: string, businessId: string, token?: string): Promise<TimeSlot[]> {
  const result = await frappeClient.call(`${API}.get_available_slots`, {
    service_id: serviceId,
    date: date,
    business_id: businessId,
    token: token,
  });
  return (result as any)?.slots || (Array.isArray(result) ? result : []);
}

export async function getAvailableSlotsByServiceCode(
  serviceCode: string, date: string, businessId: string
): Promise<{ slots: TimeSlot[]; service: Service }> {
  return frappeClient.call(`${API}.get_available_slots_by_service_code`, {
    service_code: serviceCode,
    booking_date: date,
    business_id: businessId,
  });
}

// ─── Bookings ────────────────────────────────────────────
export async function createBooking(data: {
  token?: string;
  patient_id?: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  business_id: string;
  delivery_type?: string;
  booking_source?: string;
}): Promise<Booking> {
  const result = await frappeClient.call(`${API}.create_booking`, {
    service_id: data.service_id,
    booking_date: data.booking_date,
    booking_time: data.booking_time,
    business_id: data.business_id,
    patient_id: data.patient_id,
    delivery_type: data.delivery_type || 'In Person',
  });
  return (result as any)?.booking || result;
}

export async function getPatientBookings(token: string, businessId: string, patientId?: string): Promise<Booking[]> {
  const result = await frappeClient.call(`${API}.get_patient_bookings`, {
    token,
    business_id: businessId,
    patient_id: patientId,
  });
  return (result as any)?.bookings || (Array.isArray(result) ? result : []);
}

export async function getBookingDetails(token: string, bookingId: string): Promise<Booking> {
  const result = await frappeClient.call(`${API}.get_booking_details`, {
    token,
    booking_id: bookingId,
  });
  return (result as any)?.booking || result;
}

export async function cancelBooking(token: string, bookingId: string, reason?: string): Promise<any> {
  return frappeClient.call(`${API}.cancel_booking`, {
    token,
    booking_id: bookingId,
    cancellation_reason: reason,
  });
}

export async function rescheduleBooking(
  token: string, bookingId: string, newDate: string, newTime: string
): Promise<any> {
  return frappeClient.call(`${API}.reschedule_booking`, {
    token,
    booking_id: bookingId,
    new_date: newDate,
    new_time: newTime,
  });
}

// ─── Questionnaires ──────────────────────────────────────
export async function getQuestionnaire(bookingId: string, token: string): Promise<Questionnaire> {
  return frappeClient.call(`${API}.get_questionnaire`, {
    booking_id: bookingId,
    token,
  });
}

export async function submitQuestionnaireResponse(data: {
  token: string;
  booking_id: string;
  responses: Record<string, any>;
}): Promise<any> {
  return frappeClient.call(`${API}.submit_questionnaire_response`, data);
}

export async function getPreScreeningPageData(bookingId: string, token: string): Promise<any> {
  return frappeClient.call(`${API}.get_prescreening_page_data`, {
    booking_id: bookingId,
    token,
  });
}

export async function submitPreScreeningAnswers(data: {
  token: string;
  booking_id: string;
  answers: Record<string, any>;
}): Promise<any> {
  return frappeClient.call(`${API}.submit_prescreening_answers`, data);
}

// ─── Auth ────────────────────────────────────────────────
export async function loginPatient(email: string, password: string, organization: string) {
  return frappeClient.call(`${API}.login`, { email, password, organization });
}

export async function registerPatient(data: any) {
  return frappeClient.call(`${API}.register_patient`, data);
}

export async function checkAuth(token: string) {
  return frappeClient.call(`${API}.check_auth`, { token });
}

export async function logoutPatient(token: string) {
  return frappeClient.call(`${API}.patient_logout`, { token });
}

export async function verifyPatientOtp(email: string, otp: string, organization: string) {
  return frappeClient.call(`${API}.verify_patient_otp`, { email, otp, organization });
}

export async function resendPatientOtp(email: string, organization: string) {
  return frappeClient.call(`${API}.resend_patient_otp`, { email, organization });
}

export async function sendRegistrationOtp(email: string, organization: string) {
  return frappeClient.call(`${API}.send_registration_otp`, { email, business_id: organization });
}

export async function verifyRegistrationOtp(email: string, otp: string, organization: string) {
  return frappeClient.call(`${API}.verify_registration_otp`, { email, otp, business_id: organization });
}

export async function requestPasswordReset(email: string, organization: string) {
  return frappeClient.call(`${API}.request_password_reset`, { email, organization });
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  return frappeClient.call(`${API}.change_password`, {
    token,
    current_password: currentPassword,
    new_password: newPassword,
  });
}

// ─── Profile ─────────────────────────────────────────────
export async function getPatientProfile(token: string) {
  return frappeClient.call(`${API}.get_patient_profile`, { token });
}

export async function updatePatientProfile(token: string, data: Record<string, any>) {
  return frappeClient.call(`${API}.update_patient_profile`, { token, ...data });
}

// ─── Branding ────────────────────────────────────────────
export async function getBusinessBranding(businessId: string): Promise<Branding> {
  return frappeClient.call(`${API}.get_business_branding`, { business_id: businessId });
}

export async function getPharmacyList(): Promise<any[]> {
  return frappeClient.call(`${API}.get_pharmacy_list`);
}

export async function getDefaultPharmacy(): Promise<any> {
  return frappeClient.call(`${API}.get_default_pharmacy`);
}
