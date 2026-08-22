-- ==============================================================================
-- DAYFLOW HRMS — RLS PATCH (Run this in Supabase SQL Editor)
-- Fixes: Missing companies SELECT policy causing 500 errors on all profile joins
-- ==============================================================================

-- Fix 1: Companies table was missing RLS SELECT policy
-- Any authenticated user who belongs to a company should be able to read that company's row
DROP POLICY IF EXISTS "View own company" ON public.companies;
CREATE POLICY "View own company" ON public.companies
FOR SELECT USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Fix 2: Departments table was also missing SELECT policy
DROP POLICY IF EXISTS "View company departments" ON public.departments;
CREATE POLICY "View company departments" ON public.departments
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Fix 3: Admin can insert/update companies (for signup)
DROP POLICY IF EXISTS "Admin manage company" ON public.companies;
CREATE POLICY "Admin manage company" ON public.companies
FOR ALL USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Fix 4: Company holidays - employees can view their own company holidays
DROP POLICY IF EXISTS "View company holidays" ON public.company_holidays;
CREATE POLICY "View company holidays" ON public.company_holidays
FOR SELECT USING (
  company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admin manage holidays" ON public.company_holidays;
CREATE POLICY "Admin manage holidays" ON public.company_holidays
FOR ALL USING (public.is_admin_or_hr());

-- Fix 5: Payroll payslips
DROP POLICY IF EXISTS "View own payslips" ON public.payroll_payslips;
CREATE POLICY "View own payslips" ON public.payroll_payslips
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_or_hr());

-- Fix 6: Admin INSERT profile (needed for employee provisioning from server side)
DROP POLICY IF EXISTS "Admin insert profiles" ON public.profiles;
CREATE POLICY "Admin insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.is_admin_or_hr());

-- Verify all policies are in place
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
