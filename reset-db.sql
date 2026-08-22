-- ==============================================================================
-- COMPLETE SUPABASE CLEAN RESET SCRIPT (FIXES "Database error checking email")
-- Root cause: Orphaned rows in auth.identities from previous user creation
-- Solution: Clean all auth tables (identities, sessions, tokens, users) together
-- ==============================================================================

-- 1. Clean public schema operational tables
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

-- 2. Clean ALL Supabase Auth tables in correct order (cleans orphaned email identities!)
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.users;

-- 3. Verify clean state
SELECT 'companies' AS table, COUNT(*) AS count FROM public.companies
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users
UNION ALL
SELECT 'auth.identities', COUNT(*) FROM auth.identities;
