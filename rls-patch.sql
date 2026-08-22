-- ==============================================================================
-- FINAL RLS FIX: Break infinite recursion on profiles table
-- Root cause: "View company profiles" subqueries profiles table under RLS,
-- causing PostgreSQL to recursively evaluate itself → 42P17
-- Solution: SECURITY DEFINER function runs as superuser, bypassing RLS
-- ==============================================================================

-- Step 1: Create a SECURITY DEFINER helper to safely get current user's company_id
-- This runs as the DB owner (bypasses RLS), breaking the recursive evaluation
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Step 2: Recreate ALL policies that subquery profiles using this function
-- (policies with inline subqueries on profiles are the source of recursion)
DROP POLICY IF EXISTS "View company profiles" ON public.profiles;
CREATE POLICY "View company profiles" ON public.profiles
FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
CREATE POLICY "Read own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "View own company" ON public.companies;
CREATE POLICY "View own company" ON public.companies
FOR SELECT USING (id = public.get_my_company_id());

DROP POLICY IF EXISTS "View company departments" ON public.departments;
CREATE POLICY "View company departments" ON public.departments
FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "View company holidays" ON public.company_holidays;
CREATE POLICY "View company holidays" ON public.company_holidays
FOR SELECT USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "View attendance" ON public.attendance_records;
CREATE POLICY "View attendance" ON public.attendance_records
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "View time off requests" ON public.time_off_requests;
CREATE POLICY "View time off requests" ON public.time_off_requests
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

DROP POLICY IF EXISTS "View leave allocations" ON public.time_off_allocations;
CREATE POLICY "View leave allocations" ON public.time_off_allocations
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

-- Verify
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
