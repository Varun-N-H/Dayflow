'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { 
  TimeOffRequest, 
  TimeOffAllocation, 
  CompanyHoliday, 
  Profile, 
  TimeOffType 
} from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface TimeOffDataResponse {
  success: boolean;
  currentUserProfile: Profile | null;
  isAdmin: boolean;
  allocation: TimeOffAllocation | null;
  requests: TimeOffRequest[];
  holidays: CompanyHoliday[];
  error?: string;
}

// 1. Fetch Time Off Data (Allocations, Requests, Holidays)
export async function getTimeOffDataAction(year = new Date().getFullYear()): Promise<TimeOffDataResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      currentUserProfile: null,
      isAdmin: false,
      allocation: null,
      requests: [],
      holidays: [],
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
      allocation: null,
      requests: [],
      holidays: [],
      error: 'Profile not found',
    };
  }

  const isAdmin = ['admin', 'hr_officer'].includes(currentProfile.role);
  const companyId = currentProfile.company_id;

  // 1. Fetch User Allocation for the current year
  const { data: alloc } = await supabase
    .from('time_off_allocations')
    .select('*')
    .eq('profile_id', user.id)
    .eq('year', year)
    .maybeSingle();

  // 2. Fetch Requests: All for Admin, Self for Employee
  let query = supabase
    .from('time_off_requests')
    .select('*, profile:profiles(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('profile_id', user.id);
  }

  const { data: requestsData } = await query;

  // 3. Fetch Company Holidays for the year
  const { data: holidaysData } = await supabase
    .from('company_holidays')
    .select('*')
    .eq('company_id', companyId)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date', { ascending: true });

  return {
    success: true,
    currentUserProfile: currentProfile as Profile,
    isAdmin,
    allocation: (alloc || {
      id: '',
      company_id: companyId,
      profile_id: user.id,
      year,
      paid_time_off_allocated: 24,
      paid_time_off_used: 0,
      sick_leave_allocated: 7,
      sick_leave_used: 0,
      unpaid_leaves_taken: 0,
      created_at: '',
      updated_at: '',
    }) as TimeOffAllocation,
    requests: (requestsData || []) as TimeOffRequest[],
    holidays: (holidaysData || []) as CompanyHoliday[],
  };
}

// 2. Submit Time Off Request
export async function submitTimeOffRequestAction(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) return { success: false, error: 'Profile not found' };

  const timeOffType = formData.get('timeOffType')?.toString() as TimeOffType;
  const startDate = formData.get('startDate')?.toString();
  const endDate = formData.get('endDate')?.toString();
  const allocationDays = Number(formData.get('allocationDays')) || 1;
  const remarks = formData.get('remarks')?.toString() || null;
  const attachmentFile = formData.get('attachmentFile') as File | null;

  if (!timeOffType || !startDate || !endDate) {
    return { success: false, error: 'Please select a leave type and date range.' };
  }

  try {
    // 1. Upload Attachment (if provided)
    let attachmentUrl: string | null = null;
    if (attachmentFile && attachmentFile.size > 0) {
      const fileExt = attachmentFile.name.split('.').pop() || 'pdf';
      const fileName = `leave-doc-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await adminClient.storage
        .from('documents')
        .upload(fileName, attachmentFile, { contentType: attachmentFile.type, upsert: true });

      if (!uploadErr) {
        const { data: publicUrlData } = adminClient.storage
          .from('documents')
          .getPublicUrl(fileName);
        attachmentUrl = publicUrlData.publicUrl;
      }
    }

    // 2. Insert Time Off Request
    const { error: insertErr } = await supabase
      .from('time_off_requests')
      .insert({
        company_id: profile.company_id,
        profile_id: user.id,
        time_off_type: timeOffType,
        start_date: startDate,
        end_date: endDate,
        allocation_days: allocationDays,
        remarks,
        attachment_url: attachmentUrl,
        status: 'pending',
      });

    if (insertErr) return { success: false, error: insertErr.message };

    revalidatePath('/time-off');
    revalidatePath('/employees');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit request.' };
  }
}

// 3. Approve Leave Request (Admin Only)
export async function approveLeaveAction(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr_officer'].includes(profile.role)) {
    return { success: false, error: 'Permission denied. Admins only.' };
  }

  // Update status to approved (Triggers fn_on_leave_approval in Postgres to deduct days)
  const { error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/time-off');
  revalidatePath('/employees');
  revalidatePath('/attendance');
  return { success: true };
}

// 4. Reject Leave Request (Admin Only)
export async function rejectLeaveAction(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'hr_officer'].includes(profile.role)) {
    return { success: false, error: 'Permission denied. Admins only.' };
  }

  const { error } = await supabase
    .from('time_off_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/time-off');
  revalidatePath('/employees');
  return { success: true };
}
