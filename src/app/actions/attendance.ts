'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AttendanceRecord, Profile, AttendanceStatus } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface AdminAttendanceRow {
  profile: Profile;
  attendance: AttendanceRecord | null;
  status: AttendanceStatus;
}

export interface AttendanceResponse {
  success: boolean;
  currentUserProfile: Profile | null;
  isAdmin: boolean;
  activeDate: string; // YYYY-MM-DD
  activeMonth: string; // YYYY-MM
  adminRows?: AdminAttendanceRow[];
  employeeRecords?: AttendanceRecord[];
  stats: {
    daysPresent: number;
    leavesCount: number;
    totalWorkingDays: number;
  };
  todayRecord: AttendanceRecord | null;
  error?: string;
}

// 1. Fetch Attendance Data (Admin Daily Ledger OR Employee Monthly Ledger)
export async function getAttendanceAction(selectedDateStr?: string, viewMode: 'day' | 'month' = 'day'): Promise<AttendanceResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      currentUserProfile: null,
      isAdmin: false,
      activeDate: new Date().toISOString().split('T')[0],
      activeMonth: new Date().toISOString().substring(0, 7),
      stats: { daysPresent: 0, leavesCount: 0, totalWorkingDays: 22 },
      todayRecord: null,
      error: 'Unauthorized',
    };
  }

  // Get current user profile
  const { data: currentProfile, error: profErr } = await supabase
    .from('profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single();

  if (profErr || !currentProfile) {
    return {
      success: false,
      currentUserProfile: null,
      isAdmin: false,
      activeDate: new Date().toISOString().split('T')[0],
      activeMonth: new Date().toISOString().substring(0, 7),
      stats: { daysPresent: 0, leavesCount: 0, totalWorkingDays: 22 },
      todayRecord: null,
      error: 'Profile not found',
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = selectedDateStr || todayStr;
  const activeMonth = activeDate.substring(0, 7); // 'YYYY-MM'
  const isAdmin = ['admin', 'hr_officer'].includes(currentProfile.role);
  const companyId = currentProfile.company_id;

  // 1. Fetch current user's today record
  const { data: todayRec } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('profile_id', user.id)
    .eq('date', todayStr)
    .maybeSingle();

  // 2. If Admin viewing 'day' mode: Fetch all employees and their records for activeDate
  if (isAdmin && viewMode === 'day') {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*, department:departments(*)')
      .eq('company_id', companyId)
      .order('first_name', { ascending: true });

    const { data: dateAttendance } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('company_id', companyId)
      .eq('date', activeDate);

    // Active approved leaves on that date
    const { data: dateLeaves } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lte('start_date', activeDate)
      .gte('end_date', activeDate);

    const attMap = new Map<string, AttendanceRecord>();
    dateAttendance?.forEach((rec) => attMap.set(rec.profile_id, rec as AttendanceRecord));

    const leaveSet = new Set<string>();
    dateLeaves?.forEach((l) => leaveSet.add(l.profile_id));

    const adminRows: AdminAttendanceRow[] = (allProfiles || []).map((prof) => {
      const att = attMap.get(prof.id) || null;
      let status: AttendanceStatus = 'absent';
      if (att) {
        status = att.status;
      } else if (leaveSet.has(prof.id)) {
        status = 'on_leave';
      }

      return {
        profile: prof as Profile,
        attendance: att,
        status,
      };
    });

    const presentCount = adminRows.filter((r) => r.status === 'present' || r.status === 'half_day').length;
    const leaveCount = adminRows.filter((r) => r.status === 'on_leave').length;

    return {
      success: true,
      currentUserProfile: currentProfile as Profile,
      isAdmin: true,
      activeDate,
      activeMonth,
      adminRows,
      stats: {
        daysPresent: presentCount,
        leavesCount: leaveCount,
        totalWorkingDays: (allProfiles || []).length,
      },
      todayRecord: todayRec as AttendanceRecord | null,
    };
  }

  // 3. Employee View (or Admin viewing Monthly Ledger)
  const monthStart = `${activeMonth}-01`;
  const nextMonth = new Date(Number(activeMonth.split('-')[0]), Number(activeMonth.split('-')[1]), 1)
    .toISOString()
    .split('T')[0];

  // Fetch monthly records for current user
  const { data: monthlyRecords } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('profile_id', user.id)
    .gte('date', monthStart)
    .lt('date', nextMonth)
    .order('date', { ascending: false });

  // Fetch monthly leaves for current user
  const { data: monthlyLeaves } = await supabase
    .from('time_off_requests')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'approved')
    .gte('end_date', monthStart)
    .lte('start_date', nextMonth);

  let leavesCount = 0;
  monthlyLeaves?.forEach((l) => {
    leavesCount += l.allocation_days || 1;
  });

  const daysPresent = (monthlyRecords || []).filter(
    (r) => r.status === 'present' || r.status === 'half_day'
  ).length;

  // Approximate working days in month (weekdays)
  const [year, monthNum] = activeMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(year, monthNum, 0).getDate();
  let workingDaysCount = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayOfWeek = new Date(year, monthNum - 1, d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDaysCount++; // Exclude Sat & Sun
  }

  return {
    success: true,
    currentUserProfile: currentProfile as Profile,
    isAdmin,
    activeDate,
    activeMonth,
    employeeRecords: (monthlyRecords || []) as AttendanceRecord[],
    stats: {
      daysPresent,
      leavesCount,
      totalWorkingDays: workingDaysCount,
    },
    todayRecord: todayRec as AttendanceRecord | null,
  };
}

// 2. Punch In Action
export async function punchInAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found' };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('attendance_records')
    .upsert({
      company_id: profile.company_id,
      profile_id: user.id,
      date: today,
      check_in: now,
      status: 'present',
    }, { onConflict: 'profile_id,date' });

  if (error) return { success: false, error: error.message };

  revalidatePath('/attendance');
  revalidatePath('/employees');
  return { success: true, checkInTime: now };
}

// 3. Punch Out Action
export async function punchOutAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Update check_out (triggers automatic work_hours and extra_hours calculation in Postgres)
  const { error } = await supabase
    .from('attendance_records')
    .update({
      check_out: now,
    })
    .eq('profile_id', user.id)
    .eq('date', today);

  if (error) return { success: false, error: error.message };

  revalidatePath('/attendance');
  revalidatePath('/employees');
  return { success: true, checkOutTime: now };
}
