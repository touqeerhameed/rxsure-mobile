export interface Patient {
  name: string;
  id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  county?: string;
  country?: string;
  organization?: string;
  profile_image?: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone: string;
  password: string;
  date_of_birth?: string;
  gender?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  county?: string;
  country?: string;
  organization: string;
}

export interface Service {
  name: string;
  service_name: string;
  service_code?: string;
  description?: string;
  price?: number;
  duration?: number;
  duration_minutes?: number;
  service_delivery?: string;
  is_active?: boolean;
  image?: string;
  category?: string;
  requires_questionnaire?: boolean;
  questionnaire_template?: string;
  pre_screening_questionnaire?: string;
  questionnaire?: { name: string; questionnaire_name: string; description?: string };
  business?: string;
  organization?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  pharmacist?: string;
}

export interface Booking {
  name: string;
  patient?: string;
  patient_name?: string;
  service?: string;
  service_name?: string;
  booking_date: string;
  booking_time: string;
  status: string;
  delivery_type?: string;
  business?: string;
  business_name?: string;
  pharmacist?: string;
  pharmacist_name?: string;
  notes?: string;
  cancellation_reason?: string;
  booking_source?: string;
}

export interface Question {
  name: string;
  question: string;
  question_type: string;
  options?: string;
  required?: boolean;
  depends_on_question?: string;
  depends_on_value?: string;
  warning_message?: string;
  warning_value?: string;
  order?: number;
}

export interface Questionnaire {
  name: string;
  title: string;
  questions: Question[];
  allow_save_draft?: boolean;
  completion_message?: string;
}

export interface Branding {
  business_name?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  welcome_title?: string;
  welcome_message?: string;
  terms_url?: string;
  privacy_url?: string;
  website_url?: string;
  support_email?: string;
  support_phone?: string;
}

export interface Business {
  name: string;
  business_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  logo?: string;
  require_patient_login_otp?: boolean;
}
