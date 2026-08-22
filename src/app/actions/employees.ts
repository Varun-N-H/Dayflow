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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, employees: [], currentUserProfile: null, error: 'Unauthorized' };
  }

  // Fetch current user's profile
  const { data: currentProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single();

  if (profileErr || !currentProfile) {
    return { success: false, employees: [], currentUserProfile: null, error: 'Profile not found' };
  }

  const companyId = currentProfile.company_id;
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch all profiles in company
  const { data: allProfiles, error: allProfilesErr } = await supabase
    .from('profiles')
    .select('*, department:departments(*), company:companies(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (allProfilesErr) {
    return { success: false, employees: [], currentUserProfile: currentProfile as Profile, error: allProfilesErr.message };
  }

  // 2. Fetch today's attendance records
  const { data: attendanceList } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('company_id', companyId)
    .eq('date', today);

  // 3. Fetch today's active approved leaves
  const { data: activeLeaves } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'approved')
    .lte('start_date', today)
    .gte('end_date', today);

  const attendanceMap = new Map<string, { check_in: string | null; check_out: string | null }>();
  attendanceList?.forEach((rec) => {
    attendanceMap.set(rec.profile_id, { check_in: rec.check_in, check_out: rec.check_out });
  });

  const leaveSet = new Set<string>();
  activeLeaves?.forEach((leave) => {
    leaveSet.add(leave.profile_id);
  });

  // Calculate live status for each employee
  const result: EmployeeWithLiveStatus[] = (allProfiles as Profile[]).map((prof) => {
    const att = attendanceMap.get(prof.id);
    const isOnLeave = leaveSet.has(prof.id);

    let liveStatus: 'present' | 'on_leave' | 'absent' = 'absent';

    if (att && att.check_in && !att.check_out) {
      liveStatus = 'present'; // Checked in today and active
    } else if (isOnLeave) {
      liveStatus = 'on_leave'; // Approved leave
    } else if (att && att.check_in && att.check_out) {
      liveStatus = 'present'; // Checked in and finished shift
    } else {
      liveStatus = 'absent'; // Not checked in, no leave
    }

    return {
      ...prof,
      liveStatus,
      todayCheckIn: att?.check_in,
      todayCheckOut: att?.check_out,
    };
  });

  return {
    success: true,
    employees: result,
    currentUserProfile: currentProfile as Profile,
  };
}

// 2. Admin Employee Provisioning Action
export async function createEmployeeAction(formData: FormData) {
  const firstName = formData.get('firstName')?.toString().trim();
  const lastName = formData.get('lastName')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const jobPosition = formData.get('jobPosition')?.toString().trim();
  const departmentName = formData.get('department')?.toString().trim();
  const monthlyWage = Number(formData.get('monthlyWage')) || 50000;
  const workLocation = formData.get('workLocation')?.toString().trim() || 'Headquarters';

  if (!firstName || !lastName || !email || !jobPosition) {
    return { success: false, error: 'Please fill in all mandatory fields.' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized.' };
  }

  // Verify Admin / HR role
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!currentProfile || !['admin', 'hr_officer'].includes(currentProfile.role)) {
    return { success: false, error: 'Only Administrators and HR Officers can provision employees.' };
  }

  const companyId = currentProfile.company_id;

  try {
    // 1. Resolve or create department if provided
    let departmentId: string | null = null;
    if (departmentName) {
      const { data: existingDept } = await adminClient
        .from('departments')
        .select('id')
        .eq('company_id', companyId)
        .ilike('name', departmentName)
        .maybeSingle();

      if (existingDept) {
        departmentId = existingDept.id;
      } else {
        const { data: newDept } = await adminClient
          .from('departments')
          .insert({ company_id: companyId, name: departmentName })
          .select('id')
          .single();
        if (newDept) departmentId = newDept.id;
      }
    }

    // 2. Securely generate temporary password
    const tempPassword = `Dayflow@${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create Auth User via Supabase Admin API
    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'employee',
        company_id: companyId,
      },
    });

    if (authErr || !authUser.user) {
      return { success: false, error: authErr?.message || 'Failed to create user account.' };
    }

    // 4. Create Profile (The DB trigger fn_generate_login_id handles the deterministic Login ID)
    const { data: newProfile, error: profileErr } = await adminClient
      .from('profiles')
      .insert({
        id: authUser.user.id,
        company_id: companyId,
        role: 'employee',
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        job_position: jobPosition,
        department_id: departmentId,
        work_location: workLocation,
        is_temporary_password: true,
      })
      .select()
      .single();

    if (profileErr || !newProfile) {
      return { success: false, error: profileErr?.message || 'Failed to initialize profile.' };
    }

    // 5. Update initial salary structure
    if (monthlyWage > 0) {
      await adminClient
        .from('salary_structures')
        .update({ monthly_wage: monthlyWage })
        .eq('profile_id', newProfile.id);
    }

    revalidatePath('/employees');

    return {
      success: true,
      loginId: newProfile.login_id,
      temporaryPassword: tempPassword,
      employeeName: `${firstName} ${lastName}`,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Unexpected server error.' };
  }
}
