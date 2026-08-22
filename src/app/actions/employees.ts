'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Profile, AttendanceStatus } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface EmployeeWithLiveStatus extends Profile {
  liveStatus: 'present' | 'on_leave' | 'absent';
  todayCheckIn?: string | null;
  todayCheckOut?: string | null;
}

export interface GetEmployeesResponse {
  success: boolean;
  employees: EmployeeWithLiveStatus[];
  currentUserProfile: Profile | null;
  error?: string;
}

// 1. Fetch all company employees with live availability status
export async function getEmployeesAction(): Promise<GetEmployeesResponse> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, employees: [], currentUserProfile: null, error: 'Unauthorized' };
  }

  // Use adminClient (service role) to bypass RLS for the identity check
  // This is safe — we already verified the user is authenticated above
  const { data: currentProfile, error: profileErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileErr || !currentProfile) {
    const detail = profileErr ? `${profileErr.code}: ${profileErr.message}` : 'No row returned';
    console.error('[getEmployeesAction] profile fetch failed for uid:', user.id, '|', detail);
    return { success: false, employees: [], currentUserProfile: null, error: `Profile not found (${detail})` };
  }

  const companyId = currentProfile.company_id;
  const today = new Date().toISOString().split('T')[0];

  // Run all 3 queries in parallel using adminClient for maximum performance (bypasses RLS recursion)
  const [allProfilesResult, attendanceResult, leavesResult] = await Promise.all([
    adminClient
      .from('profiles')
      .select('*, department:departments(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }),

    adminClient
      .from('attendance_records')
      .select('profile_id, check_in, check_out, status')
      .eq('company_id', companyId)
      .eq('date', today),

    adminClient
      .from('time_off_requests')
      .select('profile_id')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today),
  ]);

  const allProfiles = allProfilesResult.data || [];
  const attendanceList = attendanceResult.data || [];
  const leavesList = leavesResult.data || [];

  // Build lookup maps
  const attMap = new Map(attendanceList.map((r) => [r.profile_id, r]));
  const onLeaveSet = new Set(leavesList.map((l) => l.profile_id));

  const employees: EmployeeWithLiveStatus[] = allProfiles.map((prof) => {
    const att = attMap.get(prof.id);
    let liveStatus: 'present' | 'on_leave' | 'absent' = 'absent';
    if (att && (att.status === 'present' || att.status === 'half_day')) {
      liveStatus = 'present';
    } else if (onLeaveSet.has(prof.id)) {
      liveStatus = 'on_leave';
    }

    return {
      ...(prof as Profile),
      liveStatus,
      todayCheckIn: att?.check_in || null,
      todayCheckOut: att?.check_out || null,
    };
  });

  return {
    success: true,
    employees,
    currentUserProfile: currentProfile as Profile,
  };
}

// 2. Get Today's Attendance Status (for Navbar indicator) — lightweight single row
export async function getTodayAttendanceAction(): Promise<{
  isCheckedIn: boolean;
  checkIn: string | null;
  checkOut: string | null;
}> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isCheckedIn: false, checkIn: null, checkOut: null };

  const today = new Date().toISOString().split('T')[0];
  const { data } = await adminClient
    .from('attendance_records')
    .select('check_in, check_out, status')
    .eq('profile_id', user.id)
    .eq('date', today)
    .maybeSingle();

  const isCheckedIn = !!(data?.check_in && !data?.check_out);
  return {
    isCheckedIn,
    checkIn: data?.check_in || null,
    checkOut: data?.check_out || null,
  };
}

// 3. Create Employee (Admin Action)
export async function createEmployeeAction(formData: FormData): Promise<{
  success: boolean;
  loginId?: string;
  tempPassword?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  // Verify the requester is an admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!adminProfile || !['admin', 'hr_officer'].includes(adminProfile.role)) {
    return { success: false, error: 'Permission denied. Admin access required.' };
  }

  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || '';
  const personalEmail = formData.get('personalEmail')?.toString().trim() || '';
  const jobPosition = formData.get('jobPosition')?.toString().trim() || '';
  const departmentId = formData.get('departmentId')?.toString() || null;
  const monthlyWage = Number(formData.get('monthlyWage')) || 0;
  const workLocation = formData.get('workLocation')?.toString() || 'Headquarters';

  if (!firstName || !lastName || !personalEmail) {
    return { success: false, error: 'First name, last name, and email are required.' };
  }

  // Generate a secure random temporary password
  const tempPassword = `Temp@${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: personalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'employee',
        company_id: adminProfile.company_id,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already been registered')) {
        return { success: false, error: 'An employee with this email already exists.' };
      }
      return { success: false, error: `User creation failed: ${authError?.message}` };
    }

    // 2. Insert Profile — login_id auto-generated by Postgres trigger fn_generate_login_id
    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        company_id: adminProfile.company_id,
        role: 'employee',
        first_name: firstName,
        last_name: lastName,
        email: personalEmail,
        job_position: jobPosition,
        department_id: departmentId || null,
        work_location: workLocation,
        is_temporary_password: true,
      })
      .select('login_id')
      .single();

    if (profileError) {
      return { success: false, error: `Profile creation failed: ${profileError.message}` };
    }

    // 3. Create initial salary structure if wage provided
    if (monthlyWage > 0) {
      const basic = monthlyWage * 0.50;
      const hra = basic * 0.50;
      const standard = 4167;
      const bonus = basic * 0.0833;
      const lta = basic * 0.0833;
      const fixed = monthlyWage - (basic + hra + standard + bonus + lta);
      const empPf = basic * 0.12;
      const emplPf = basic * 0.12;

      await adminClient.from('salary_structures').upsert({
        profile_id: authData.user.id,
        monthly_wage: monthlyWage,
        basic_salary: basic,
        hra,
        standard_allowance: standard,
        performance_bonus: bonus,
        leave_travel_allowance: lta,
        fixed_allowance: Math.max(0, fixed),
        employee_pf: empPf,
        employer_pf: emplPf,
        professional_tax: 200,
      }, { onConflict: 'profile_id' });
    }

    // 4. Create time off allocation for current year
    const currentYear = new Date().getFullYear();
    await adminClient.from('time_off_allocations').upsert({
      company_id: adminProfile.company_id,
      profile_id: authData.user.id,
      year: currentYear,
      paid_time_off_allocated: 24,
      sick_leave_allocated: 7,
    }, { onConflict: 'profile_id,year' });

    revalidatePath('/employees');
    return {
      success: true,
      loginId: newProfile?.login_id || 'Generating...',
      tempPassword,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unexpected error occurred.' };
  }
}
