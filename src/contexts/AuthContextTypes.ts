import { createContext } from "react";

// Profile interfaces matching DATABASE_SCHEMA.sql exactly

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  is_super_admin?: boolean;
  avatar_url?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  position?: string;
  employee_id?: string;
  hire_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LandlordProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  company_registration?: string;
  tax_id?: string;
  address?: string;
  city?: string;
  postcode?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_sort_code?: string;
  preferred_payment_method?: string;
  avatar_url?: string;
  is_verified?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LodgerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  ni_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  current_address?: string;
  city?: string;
  postcode?: string;
  previous_address?: string;
  employment_status?: string;
  employer_name?: string;
  employer_contact?: string;
  monthly_income?: number;
  avatar_url?: string;
  notes?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceUserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  service_type?: string;
  certification_number?: string;
  insurance_expiry?: string;
  hourly_rate?: number;
  rating?: number;
  total_jobs?: number;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserProfile = LandlordProfile | LodgerProfile | StaffProfile | AdminProfile | ServiceUserProfile | null;

export interface User {
  id: string;
  email: string;
  role: "lodger" | "landlord" | "staff" | "admin" | "service_user";
  name: string;
  profile: UserProfile;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string, 
    password: string, 
    role: "lodger" | "landlord", 
    profileData: { full_name: string; phone?: string; [key: string]: unknown }
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
