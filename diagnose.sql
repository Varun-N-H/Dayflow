-- ==============================================================================
-- DAYFLOW HRMS — PROFILE REPAIR QUERY
-- Run this in Supabase SQL Editor AFTER rls-patch.sql
-- ==============================================================================

-- Step 1: Find your auth user ID (look for your email)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Check if your profile row exists
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;

-- Step 3: Check if your company row exists
SELECT * FROM public.companies ORDER BY created_at DESC LIMIT 5;
