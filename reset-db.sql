-- ==============================================================================
-- DAYFLOW HRMS — COMPLETE DATABASE RESET SCRIPT
-- Run this in Supabase SQL Editor to wipe all organizations, profiles, 
-- auth accounts, attendance, leaves, and quotas for a clean fresh start.
-- ==============================================================================

-- 1. Disable triggers temporarily to avoid cascading trigger locks
SET session_replication_role = 'replica';

-- 2. Clean out all operational HRMS data
TRUNCATE TABLE public.payroll_payslips CASCADE;
TRUNCATE TABLE public.time_off_requests CASCADE;
TRUNCATE TABLE public.time_off_allocations CASCADE;
TRUNCATE TABLE public.attendance_records CASCADE;
TRUNCATE TABLE public.salary_structures CASCADE;
TRUNCATE TABLE public.employee_private_info CASCADE;
TRUNCATE TABLE public.employee_resumes CASCADE;
TRUNCATE TABLE public.company_holidays CASCADE;
TRUNCATE TABLE public.departments CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.companies CASCADE;

-- 3. Clean out all Supabase Auth users
DELETE FROM auth.users;

-- 4. Clean out uploaded company assets / avatars from storage (optional)
DELETE FROM storage.objects WHERE bucket_id IN ('company-assets', 'avatars', 'documents');

-- 5. Re-enable standard triggers
SET session_replication_role = 'origin';

-- 6. Verify clean state
SELECT 'companies' AS table_name, COUNT(*) AS row_count FROM public.companies
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
