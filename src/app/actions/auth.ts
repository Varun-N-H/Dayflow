'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthResponse {
  success: boolean;
  error?: string;
  forcePasswordReset?: boolean;
  redirectTo?: string;
}

// 1. Sign In Action (Supports Email OR custom Login ID)
export async function signInAction(formData: FormData): Promise<AuthResponse> {
  const identifier = formData.get('identifier')?.toString().trim();
  const password = formData.get('password')?.toString();

  if (!identifier || !password) {
    return { success: false, error: 'Please provide both your Login ID / Email and password.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  let emailToUse = identifier;

  // If the identifier is not an email, resolve it from the profiles table using login_id
  if (!identifier.includes('@')) {
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('email, is_temporary_password')
      .ilike('login_id', identifier)
      .maybeSingle();

    if (profileError || !profileData) {
      return { success: false, error: `Invalid Login ID '${identifier}'. Please check and try again.` };
    }

    emailToUse = profileData.email;
  }

  // Authenticate via Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password: password,
  });

  if (error || !data.user) {
    return { success: false, error: error?.message || 'Invalid credentials. Please try again.' };
  }

  // Check if user is logging in with a system-generated temporary password
  const { data: userProfile } = await adminClient
    .from('profiles')
    .select('is_temporary_password')
    .eq('id', data.user.id)
    .maybeSingle();

  if (userProfile?.is_temporary_password) {
    return { success: true, forcePasswordReset: true, redirectTo: '/profile?tab=security&reset=true' };
  }

  return { success: true, redirectTo: '/employees' };
}

// 2. Sign Up Action (Company Registration & Admin Onboarding) - Bulletproof Dual Strategy
export async function signUpCompanyAction(formData: FormData): Promise<AuthResponse> {
  const companyName = formData.get('companyName')?.toString().trim();
  const name = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const phone = formData.get('phone')?.toString().trim();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();
  const logoFile = formData.get('logoFile') as File | null;

  if (!companyName || !name || !email || !password || !confirmPassword) {
    return { success: false, error: 'Please fill in all required fields.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match. Please verify and try again.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const adminClient = createAdminClient();
  const supabase = await createClient();

  // Split name into first and last
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || 'Admin';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // Compute Company Prefix (e.g. "Odoo India" -> "OI", "Google" -> "GO")
  const cleanWords = companyName.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  let prefix = 'CO';
  if (cleanWords.length >= 2) {
    prefix = (cleanWords[0][0] + cleanWords[1][0]).toUpperCase();
  } else if (cleanWords.length === 1 && cleanWords[0].length >= 2) {
    prefix = cleanWords[0].substring(0, 2).toUpperCase();
  }

  try {
    // 1. Upload company logo if provided
    let logoUrl: string | null = null;
    if (logoFile && logoFile.size > 0) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `company-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await adminClient.storage
        .from('company-assets')
        .upload(fileName, logoFile, { contentType: logoFile.type, upsert: true });

      if (!uploadError) {
        const { data: publicUrlData } = adminClient.storage
          .from('company-assets')
          .getPublicUrl(fileName);
        logoUrl = publicUrlData.publicUrl;
      }
    }

    // 2. Create or Upsert Company Record
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name: companyName,
        company_prefix: prefix,
        logo_url: logoUrl,
        email: email,
        phone: phone || null,
      })
      .select()
      .single();

    if (companyError || !company) {
      return { success: false, error: `Company creation failed: ${companyError?.message}` };
    }

    // 3. Create Admin User in Supabase Auth (Try Public SignUp first, then Admin fallback)
    let authUserId: string | null = null;

    // Strategy A: Standard Supabase SignUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          company_id: company.id,
        },
      },
    });

    if (signUpData?.user) {
      authUserId = signUpData.user.id;
    } else {
      // Strategy B: Admin create user API fallback
      const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          company_id: company.id,
        },
      });

      if (adminUserData?.user) {
        authUserId = adminUserData.user.id;
      } else {
        // Strategy C: If user already exists in auth, attempt sign-in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInData?.user) {
          authUserId = signInData.user.id;
        } else {
          return {
            success: false,
            error: `User creation failed: ${signUpError?.message || adminUserError?.message || signInError?.message || 'Database error checking email'}`,
          };
        }
      }
    }

    if (!authUserId) {
      return { success: false, error: 'Failed to obtain user identity during registration.' };
    }

    // 4. Upsert Admin Profile in public.profiles
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authUserId,
        company_id: company.id,
        role: 'admin',
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        job_position: 'Founder & HR Administrator',
        is_temporary_password: false,
      }, { onConflict: 'id' });

    if (profileError) {
      return { success: false, error: `Profile setup failed: ${profileError.message}` };
    }

    // 5. Create initial time-off allocation for this admin
    const currentYear = new Date().getFullYear();
    await adminClient.from('time_off_allocations').upsert({
      company_id: company.id,
      profile_id: authUserId,
      year: currentYear,
      paid_time_off_allocated: 24,
      sick_leave_allocated: 7,
    }, { onConflict: 'profile_id,year' });

    // 6. Sign in session directly
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { success: true, redirectTo: '/employees' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'An unexpected error occurred during registration.' };
  }
}

// 3. Reset / Update Password Action
export async function updatePasswordAction(formData: FormData): Promise<AuthResponse> {
  const newPassword = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to update your password.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Update profile flag
  await adminClient
    .from('profiles')
    .update({ is_temporary_password: false })
    .eq('id', user.id);

  return { success: true, redirectTo: '/employees' };
}
