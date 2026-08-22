export type AppRole = 'admin' | 'hr_officer' | 'employee';
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'on_leave';
export type TimeOffType = 'paid_time_off' | 'sick_leave' | 'unpaid_leaves';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type MaritalStatusType = 'single' | 'married' | 'divorced' | 'widowed';
export type WageType = 'fixed_wage';

export interface Company {
  id: string;
  name: string;
  company_prefix: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  login_id: string;
  role: AppRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  job_position: string | null;
  department_id: string | null;
  manager_id: string | null;
  work_location: string;
  is_temporary_password: boolean;
  date_of_joining: string;
  joining_year: number;
  serial_number: number;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  company?: Company;
  department?: Department;
  manager?: Profile;
}

export interface EmployeeResume {
  id: string;
  profile_id: string;
  about: string | null;
  what_i_love_about_job: string | null;
  interests_and_hobbies: string | null;
  skills: string[];
  certifications: {
    title: string;
    issuer?: string;
    date?: string;
    url?: string;
  }[];
  updated_at: string;
}

export interface EmployeePrivateInfo {
  id: string;
  profile_id: string;
  date_of_birth: string | null;
  residing_address: string | null;
  nationality: string | null;
  personal_email: string | null;
  gender: GenderType | null;
  marital_status: MaritalStatusType | null;
  account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  pan_number: string | null;
  uan_number: string | null;
  emp_code: string | null;
  updated_at: string;
}

export interface SalaryStructure {
  id: string;
  profile_id: string;
  wage_type: WageType;
  monthly_wage: number;
  yearly_wage: number;
  working_days_per_week: number;
  break_time_hours: number;
  basic_salary: number;
  hra: number;
  standard_allowance: number;
  performance_bonus: number;
  leave_travel_allowance: number;
  fixed_allowance: number;
  employee_pf: number;
  employer_pf: number;
  professional_tax: number;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  company_id: string;
  profile_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours: number;
  extra_hours: number;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface TimeOffAllocation {
  id: string;
  company_id: string;
  profile_id: string;
  year: number;
  paid_time_off_allocated: number;
  paid_time_off_used: number;
  sick_leave_allocated: number;
  sick_leave_used: number;
  unpaid_leaves_taken: number;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: string;
  company_id: string;
  profile_id: string;
  time_off_type: TimeOffType;
  start_date: string;
  end_date: string;
  allocation_days: number;
  attachment_url: string | null;
  remarks: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewer_comments: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  reviewer?: Profile;
}

export interface PayrollPayslip {
  id: string;
  company_id: string;
  profile_id: string;
  month: number;
  year: number;
  total_working_days: number;
  present_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  payable_days: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  pdf_url: string | null;
  created_at: string;
  profile?: Profile;
}

export interface CompanyHoliday {
  id: string;
  company_id: string;
  name: string;
  date: string;
  is_mandatory: boolean;
  created_at: string;
}
