'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Profile, EmployeeResume, EmployeePrivateInfo, SalaryStructure } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface FullProfileData {
  profile: Profile;
  resume: EmployeeResume | null;
  privateInfo: EmployeePrivateInfo | null;
  salaryStructure: SalaryStructure | null;
  isCurrentUser: boolean;
  isAdmin: boolean;
}

// 1. Fetch complete profile data with role security checks
export async function getProfileDataAction(targetProfileId?: string): Promise<{
  success: boolean;
  data?: FullProfileData;
  error?: string;
}> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use adminClient (service role) to bypass RLS for identity check
  const { data: currentProfile, error: currErr } = await adminClient
    .from('profiles')
    .select('*, department:departments(name)')
    .eq('id', user.id)
    .single();

  if (currErr || !currentProfile) {
    return { success: false, error: 'User profile not found' };
  }

  const profileId = targetProfileId || user.id;
  const isCurrentUser = profileId === user.id;
  const isAdmin = ['admin', 'hr_officer'].includes(currentProfile.role);

  // Fetch target profile, resume, privateInfo, and salary in parallel using adminClient
  const [targetProfileRes, resumeRes, privRes, salaryRes] = await Promise.all([
    adminClient
      .from('profiles')
      .select('*, department:departments(name)')
      .eq('id', profileId)
      .single(),

    adminClient
      .from('employee_resumes')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle(),

    (isCurrentUser || isAdmin)
      ? adminClient.from('employee_private_info').select('*').eq('profile_id', profileId).maybeSingle()
      : Promise.resolve({ data: null }),

    isAdmin
      ? adminClient.from('salary_structures').select('*').eq('profile_id', profileId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (targetProfileRes.error || !targetProfileRes.data) {
    return { success: false, error: 'Profile not found' };
  }

  return {
    success: true,
    data: {
      profile: targetProfileRes.data as Profile,
      resume: resumeRes.data as EmployeeResume | null,
      privateInfo: privRes.data as EmployeePrivateInfo | null,
      salaryStructure: salaryRes.data as SalaryStructure | null,
      isCurrentUser,
      isAdmin,
    },
  };
}

// 2. Update Profile Header info
export async function updateProfileHeaderAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const firstName = formData.get('firstName')?.toString().trim();
  const lastName = formData.get('lastName')?.toString().trim();
  const jobPosition = formData.get('jobPosition')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const workLocation = formData.get('workLocation')?.toString().trim();

  const { error } = await adminClient
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      job_position: jobPosition,
      phone: phone || null,
      work_location: workLocation || 'Headquarters',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/employees');
  return { success: true };
}

// 3. Update Resume (Bio, Skills, Certifications)
export async function updateResumeAction(profileId: string, payload: Partial<EmployeeResume>) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await adminClient
    .from('employee_resumes')
    .upsert({
      profile_id: profileId,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 4. Update Private Info & Bank Details
export async function updatePrivateInfoAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const dob = formData.get('dob')?.toString() || null;
  const address = formData.get('address')?.toString() || '';
  const nationality = formData.get('nationality')?.toString() || 'Indian';
  const personalEmail = formData.get('personalEmail')?.toString() || '';
  const gender = formData.get('gender')?.toString() || 'prefer_not_to_say';
  const maritalStatus = formData.get('maritalStatus')?.toString() || 'single';
  const bankAccount = formData.get('bankAccount')?.toString() || '';
  const bankName = formData.get('bankName')?.toString() || '';
  const ifscCode = formData.get('ifscCode')?.toString() || '';
  const pan = formData.get('pan')?.toString() || '';
  const uan = formData.get('uan')?.toString() || '';
  const empCode = formData.get('empCode')?.toString() || '';

  const { error } = await adminClient
    .from('employee_private_info')
    .upsert({
      profile_id: profileId,
      date_of_birth: dob,
      residing_address: address,
      nationality,
      personal_email: personalEmail,
      gender: gender as any,
      marital_status: maritalStatus as any,
      account_number: bankAccount,
      bank_name: bankName,
      ifsc_code: ifscCode,
      pan_number: pan,
      uan_number: uan,
      emp_code: empCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 5. Update Salary Structure (Admin Only)
export async function updateSalaryStructureAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: requester } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!requester || !['admin', 'hr_officer'].includes(requester.role)) {
    return { success: false, error: 'Permission denied. Only Admins can modify salary structures.' };
  }

  const monthlyWage = Number(formData.get('monthlyWage')) || 0;
  const basic = Number(formData.get('basicSalary')) || monthlyWage * 0.5;
  const hra = Number(formData.get('hra')) || basic * 0.5;
  const standard = Number(formData.get('standardAllowance')) || 4167;
  const bonus = Number(formData.get('performanceBonus')) || basic * 0.0833;
  const lta = Number(formData.get('lta')) || basic * 0.0833;
  const fixed = Number(formData.get('fixedAllowance')) || Math.max(0, monthlyWage - (basic + hra + standard + bonus + lta));
  const empPf = Number(formData.get('employeePf')) || basic * 0.12;
  const emplPf = Number(formData.get('employerPf')) || basic * 0.12;
  const pt = Number(formData.get('professionalTax')) || 200;

  const { error } = await adminClient
    .from('salary_structures')
    .upsert({
      profile_id: profileId,
      monthly_wage: monthlyWage,
      basic_salary: basic,
      hra,
      standard_allowance: standard,
      performance_bonus: bonus,
      leave_travel_allowance: lta,
      fixed_allowance: fixed,
      employee_pf: empPf,
      employer_pf: emplPf,
      professional_tax: pt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 6. Upload Avatar Action
export async function uploadAvatarAction(profileId: string, formData: FormData): Promise<{
  success: boolean;
  avatarUrl?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const avatarFile = formData.get('avatarFile') as File | null;
  if (!avatarFile || avatarFile.size === 0) {
    return { success: false, error: 'No avatar file provided.' };
  }

  const fileExt = avatarFile.name.split('.').pop() || 'png';
  const fileName = `avatar-${profileId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(fileName, avatarFile, { contentType: avatarFile.type, upsert: true });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrlData } = adminClient.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = publicUrlData.publicUrl;

  await adminClient
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', profileId);

  revalidatePath('/profile');
  revalidatePath('/employees');
  return { success: true, avatarUrl };
}

