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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get current user's profile (no company join to avoid RLS issues)
  const { data: currentProfile, error: currErr } = await supabase
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

  // Fetch target profile (no company join)
  const { data: targetProfile, error: targetErr } = await supabase
    .from('profiles')
    .select('*, department:departments(name)')
    .eq('id', profileId)
    .single();

  if (targetErr || !targetProfile) {
    return { success: false, error: 'Profile not found' };
  }

  // Fetch Resume
  const { data: resume } = await supabase
    .from('employee_resumes')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  // Fetch Private Info (only accessible by self or admin)
  let privateInfo: EmployeePrivateInfo | null = null;
  if (isCurrentUser || isAdmin) {
    const { data: priv } = await supabase
      .from('employee_private_info')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();
    privateInfo = priv as EmployeePrivateInfo | null;
  }

  // Fetch Salary Structure (STRICTLY Admin / HR Officer only)
  let salaryStructure: SalaryStructure | null = null;
  if (isAdmin) {
    const { data: sal } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();
    salaryStructure = sal as SalaryStructure | null;
  }

  return {
    success: true,
    data: {
      profile: targetProfile as Profile,
      resume: resume as EmployeeResume | null,
      privateInfo,
      salaryStructure,
      isCurrentUser,
      isAdmin,
    },
  };
}

// 2. Update Profile Header info
export async function updateProfileHeaderAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const firstName = formData.get('firstName')?.toString().trim();
  const lastName = formData.get('lastName')?.toString().trim();
  const jobPosition = formData.get('jobPosition')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const workLocation = formData.get('workLocation')?.toString().trim();

  const { error } = await supabase
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

// 3. Update Resume (Bio, What I Love, Interests, Skills, Certifications)
export async function updateResumeAction(profileId: string, payload: {
  about?: string;
  what_i_love_about_job?: string;
  interests_and_hobbies?: string;
  skills?: string[];
  certifications?: Array<{ title: string; issuer?: string; date?: string; url?: string }>;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('employee_resumes')
    .upsert({
      profile_id: profileId,
      about: payload.about,
      what_i_love_about_job: payload.what_i_love_about_job,
      interests_and_hobbies: payload.interests_and_hobbies,
      skills: payload.skills || [],
      certifications: payload.certifications || [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 4. Update Private Info (DOB, Address, Bank details, PAN, UAN)
export async function updatePrivateInfoAction(profileId: string, formData: FormData) {
  const supabase = await createClient();

  const dateOfBirth = formData.get('dateOfBirth')?.toString() || null;
  const residingAddress = formData.get('residingAddress')?.toString() || null;
  const nationality = formData.get('nationality')?.toString() || 'Indian';
  const personalEmail = formData.get('personalEmail')?.toString() || null;
  const gender = formData.get('gender')?.toString() || 'prefer_not_to_say';
  const maritalStatus = formData.get('maritalStatus')?.toString() || 'single';
  const accountNumber = formData.get('accountNumber')?.toString() || null;
  const bankName = formData.get('bankName')?.toString() || null;
  const ifscCode = formData.get('ifscCode')?.toString() || null;
  const panNumber = formData.get('panNumber')?.toString() || null;
  const uanNumber = formData.get('uanNumber')?.toString() || null;
  const empCode = formData.get('empCode')?.toString() || null;

  const { error } = await supabase
    .from('employee_private_info')
    .upsert({
      profile_id: profileId,
      date_of_birth: dateOfBirth,
      residing_address: residingAddress,
      nationality: nationality,
      personal_email: personalEmail,
      gender: gender as any,
      marital_status: maritalStatus as any,
      account_number: accountNumber,
      bank_name: bankName,
      ifsc_code: ifscCode,
      pan_number: panNumber,
      uan_number: uanNumber,
      emp_code: empCode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 5. Update Salary Structure
export async function updateSalaryStructureAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentProfile || !['admin', 'hr_officer'].includes(currentProfile.role)) {
    return { success: false, error: 'Access denied. Salary updates are restricted to Administrators.' };
  }

  const monthlyWage = Number(formData.get('monthlyWage')) || 50000;
  const workingDays = Number(formData.get('workingDays')) || 5;
  const breakTime = Number(formData.get('breakTime')) || 1.0;

  const basic = monthlyWage * 0.50;
  const hra = basic * 0.50;
  const standardAllowance = 4167.00;
  const performanceBonus = basic * 0.0833;
  const lta = basic * 0.0833;
  const fixedAllowance = Math.max(0, monthlyWage - (basic + hra + standardAllowance + performanceBonus + lta));

  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const professionalTax = 200.00;

  const { error } = await adminClient
    .from('salary_structures')
    .upsert({
      profile_id: profileId,
      monthly_wage: monthlyWage,
      yearly_wage: monthlyWage * 12,
      working_days_per_week: workingDays,
      break_time_hours: breakTime,
      basic_salary: basic,
      hra: hra,
      standard_allowance: standardAllowance,
      performance_bonus: performanceBonus,
      leave_travel_allowance: lta,
      fixed_allowance: fixedAllowance,
      employee_pf: pfEmployee,
      employer_pf: pfEmployer,
      professional_tax: professionalTax,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/profile');
  return { success: true };
}

// 6. Upload Avatar Image
export async function uploadAvatarAction(profileId: string, formData: FormData) {
  const file = formData.get('avatarFile') as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: 'No image file provided.' };
  }

  const adminClient = createAdminClient();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `avatar-${profileId}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await adminClient.storage
    .from('avatars')
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: { publicUrl } } = adminClient.storage
    .from('avatars')
    .getPublicUrl(fileName);

  await adminClient
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', profileId);

  revalidatePath('/profile');
  revalidatePath('/employees');
  return { success: true, avatarUrl: publicUrl };
}
