-- ==============================================================================
-- DAYFLOW HRMS — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Built for: Multi-tenant, Role-Based Access Control, and Free Tier compatibility
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'hr_officer', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE time_off_type AS ENUM ('paid_time_off', 'sick_leave', 'unpaid_leaves');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE marital_status_type AS ENUM ('single', 'married', 'divorced', 'widowed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE wage_type AS ENUM ('fixed_wage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 2. CORE MULTI-TENANT TABLES
-- ==============================================================================

-- 2.1 Companies (Organizations)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company_prefix VARCHAR(4) NOT NULL, -- e.g. 'OI'
    logo_url TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, name)
);

-- 2.3 User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    login_id VARCHAR(30) UNIQUE NOT NULL, -- Format: [OI][JODO][2026][0001]
    role app_role NOT NULL DEFAULT 'employee',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    job_position TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    work_location TEXT DEFAULT 'Headquarters',
    is_temporary_password BOOLEAN NOT NULL DEFAULT true,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    joining_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    serial_number INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, joining_year, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_login_id ON public.profiles(login_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2.4 Employee Resume (Bio, Skills, Certifications) - Wireframe three.png
CREATE TABLE IF NOT EXISTS public.employee_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    about TEXT,
    what_i_love_about_job TEXT,
    interests_and_hobbies TEXT,
    skills JSONB DEFAULT '[]'::JSONB,
    certifications JSONB DEFAULT '[]'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Employee Private Info & Bank Details - Wireframe four.png
CREATE TABLE IF NOT EXISTS public.employee_private_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    residing_address TEXT,
    nationality TEXT DEFAULT 'Indian',
    personal_email TEXT,
    gender gender_type,
    marital_status marital_status_type,
    account_number TEXT,
    bank_name TEXT,
    ifsc_code TEXT,
    pan_number TEXT,
    uan_number TEXT,
    emp_code TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Salary Structure Engine (Admin-Only) - Wireframes three.png & four.png
CREATE TABLE IF NOT EXISTS public.salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wage_type wage_type NOT NULL DEFAULT 'fixed_wage',
    monthly_wage NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    yearly_wage NUMERIC(12, 2) GENERATED ALWAYS AS (monthly_wage * 12) STORED,
    working_days_per_week INT NOT NULL DEFAULT 5,
    break_time_hours NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    
    -- Auto-calculated salary components
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    hra NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    standard_allowance NUMERIC(12, 2) NOT NULL DEFAULT 4167.00,
    performance_bonus NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    leave_travel_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fixed_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Contributions & Deductions
    employee_pf NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    employer_pf NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    professional_tax NUMERIC(12, 2) NOT NULL DEFAULT 200.00,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Attendance Records & Overtime Ledger - Wireframe five.png
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    work_hours NUMERIC(5, 2) DEFAULT 0.00,
    extra_hours NUMERIC(5, 2) DEFAULT 0.00,
    status attendance_status NOT NULL DEFAULT 'present',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(company_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_profile_date ON public.attendance_records(profile_id, date);

-- 2.8 Time Off Allocations (Annual Quotas)
CREATE TABLE IF NOT EXISTS public.time_off_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
    paid_time_off_allocated NUMERIC(5, 2) NOT NULL DEFAULT 24.00,
    paid_time_off_used NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    sick_leave_allocated NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    sick_leave_used NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    unpaid_leaves_taken NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, year)
);

-- 2.9 Time Off Requests & Approvals Queue - Wireframe six.png
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    time_off_type time_off_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    allocation_days NUMERIC(5, 2) NOT NULL,
    attachment_url TEXT,
    remarks TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_comments TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_off_company ON public.time_off_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_time_off_profile ON public.time_off_requests(profile_id);

-- 2.10 Payroll Payslips
CREATE TABLE IF NOT EXISTS public.payroll_payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    total_working_days INT NOT NULL,
    present_days INT NOT NULL,
    paid_leave_days INT NOT NULL DEFAULT 0,
    unpaid_leave_days INT NOT NULL DEFAULT 0,
    payable_days NUMERIC(5, 2) NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, month, year)
);

-- 2.11 Company Holidays
CREATE TABLE IF NOT EXISTS public.company_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, date)
);

-- ==============================================================================
-- 3. STORED PROCEDURES & AUTOMATION TRIGGERS
-- ==============================================================================

-- 3.1 Trigger: Auto-Compute Salary Breakdown
CREATE OR REPLACE FUNCTION public.fn_compute_salary_structure()
RETURNS TRIGGER AS $$
DECLARE
    v_basic NUMERIC(12, 2);
    v_hra NUMERIC(12, 2);
    v_std NUMERIC(12, 2) := 4167.00;
    v_bonus NUMERIC(12, 2);
    v_lta NUMERIC(12, 2);
    v_fixed NUMERIC(12, 2);
    v_pf NUMERIC(12, 2);
BEGIN
    v_basic := ROUND(NEW.monthly_wage * 0.50, 2);
    v_hra := ROUND(v_basic * 0.50, 2);
    v_bonus := ROUND(v_basic * 0.0833, 2);
    v_lta := ROUND(v_basic * 0.0833, 2);
    v_fixed := NEW.monthly_wage - (v_basic + v_hra + v_std + v_bonus + v_lta);
    v_pf := ROUND(v_basic * 0.12, 2);
    
    NEW.basic_salary := v_basic;
    NEW.hra := v_hra;
    NEW.standard_allowance := v_std;
    NEW.performance_bonus := v_bonus;
    NEW.leave_travel_allowance := v_lta;
    NEW.fixed_allowance := v_fixed;
    NEW.employee_pf := v_pf;
    NEW.employer_pf := v_pf;
    NEW.professional_tax := 200.00;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_salary_structure ON public.salary_structures;
CREATE TRIGGER trg_compute_salary_structure
BEFORE INSERT OR UPDATE OF monthly_wage ON public.salary_structures
FOR EACH ROW
EXECUTE FUNCTION public.fn_compute_salary_structure();

-- 3.2 Trigger: Calculate Work Hours and Overtime on Punch Out
CREATE OR REPLACE FUNCTION public.fn_calculate_attendance_hours()
RETURNS TRIGGER AS $$
DECLARE
    v_duration_hours NUMERIC(5, 2);
    v_regular_hours NUMERIC(5, 2) := 8.00;
BEGIN
    IF NEW.check_in IS NOT NULL AND NEW.check_out IS NOT NULL THEN
        v_duration_hours := ROUND(EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0, 2);
        NEW.work_hours := v_duration_hours;
        IF v_duration_hours > v_regular_hours THEN
            NEW.extra_hours := v_duration_hours - v_regular_hours;
        ELSE
            NEW.extra_hours := 0.00;
        END IF;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_attendance_hours ON public.attendance_records;
CREATE TRIGGER trg_calculate_attendance_hours
BEFORE INSERT OR UPDATE OF check_in, check_out ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.fn_calculate_attendance_hours();

-- 3.3 Trigger: Deduct Leave Balances on Approval
CREATE OR REPLACE FUNCTION public.fn_on_leave_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        IF NEW.time_off_type = 'paid_time_off' THEN
            UPDATE public.time_off_allocations
            SET paid_time_off_used = paid_time_off_used + NEW.allocation_days,
                updated_at = now()
            WHERE profile_id = NEW.profile_id
              AND year = EXTRACT(YEAR FROM NEW.start_date)::INT;
        ELSIF NEW.time_off_type = 'sick_leave' THEN
            UPDATE public.time_off_allocations
            SET sick_leave_used = sick_leave_used + NEW.allocation_days,
                updated_at = now()
            WHERE profile_id = NEW.profile_id
              AND year = EXTRACT(YEAR FROM NEW.start_date)::INT;
        ELSIF NEW.time_off_type = 'unpaid_leaves' THEN
            UPDATE public.time_off_allocations
            SET unpaid_leaves_taken = unpaid_leaves_taken + NEW.allocation_days,
                updated_at = now()
            WHERE profile_id = NEW.profile_id
              AND year = EXTRACT(YEAR FROM NEW.start_date)::INT;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_leave_approval ON public.time_off_requests;
CREATE TRIGGER trg_on_leave_approval
AFTER UPDATE OF status ON public.time_off_requests
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_leave_approval();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_private_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Admin or HR Officer
CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr_officer')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "View company profiles" ON public.profiles;
CREATE POLICY "View company profiles" ON public.profiles
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Update own profile or admin edit all" ON public.profiles;
CREATE POLICY "Update own profile or admin edit all" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR public.is_admin_or_hr()
);

-- Resumes Policies
DROP POLICY IF EXISTS "View resumes" ON public.employee_resumes;
CREATE POLICY "View resumes" ON public.employee_resumes
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage own resume" ON public.employee_resumes;
CREATE POLICY "Manage own resume" ON public.employee_resumes
FOR ALL USING (profile_id = auth.uid() OR public.is_admin_or_hr());

-- Private Info Policies
DROP POLICY IF EXISTS "View own private info or admin" ON public.employee_private_info;
CREATE POLICY "View own private info or admin" ON public.employee_private_info
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Edit own private info or admin" ON public.employee_private_info;
CREATE POLICY "Edit own private info or admin" ON public.employee_private_info
FOR ALL USING (profile_id = auth.uid() OR public.is_admin_or_hr());

-- Salary Structures: ADMIN ONLY
DROP POLICY IF EXISTS "Admin only view salary" ON public.salary_structures;
CREATE POLICY "Admin only view salary" ON public.salary_structures
FOR SELECT USING (public.is_admin_or_hr());

DROP POLICY IF EXISTS "Admin only manage salary" ON public.salary_structures;
CREATE POLICY "Admin only manage salary" ON public.salary_structures
FOR ALL USING (public.is_admin_or_hr());

-- Attendance Policies
DROP POLICY IF EXISTS "View attendance" ON public.attendance_records;
CREATE POLICY "View attendance" ON public.attendance_records
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Employee punch in" ON public.attendance_records;
CREATE POLICY "Employee punch in" ON public.attendance_records
FOR INSERT WITH CHECK (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Update attendance" ON public.attendance_records;
CREATE POLICY "Update attendance" ON public.attendance_records
FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin_or_hr());

-- Time Off Policies
DROP POLICY IF EXISTS "View time off requests" ON public.time_off_requests;
CREATE POLICY "View time off requests" ON public.time_off_requests
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Submit time off request" ON public.time_off_requests;
CREATE POLICY "Submit time off request" ON public.time_off_requests
FOR INSERT WITH CHECK (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Admin approve time off" ON public.time_off_requests;
CREATE POLICY "Admin approve time off" ON public.time_off_requests
FOR UPDATE USING (public.is_admin_or_hr());

-- Time Off Allocations
DROP POLICY IF EXISTS "View leave allocations" ON public.time_off_allocations;
CREATE POLICY "View leave allocations" ON public.time_off_allocations
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "Admin manage allocations" ON public.time_off_allocations;
CREATE POLICY "Admin manage allocations" ON public.time_off_allocations
FOR ALL USING (public.is_admin_or_hr());
