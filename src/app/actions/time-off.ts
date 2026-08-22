'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { 
  TimeOffAllocation, 
  TimeOffRequest, 
  CompanyHoliday, 
  Profile, 
  TimeOffType, 
  LeaveStatus 
} from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export interface TimeOffPageData {
  success: boolean;
  currentUserProfile: Profile | null;
  isAdmin: boolean;
  allocation: TimeOffAllocation | null;
  requests: TimeOffRequest[];
  holidays: CompanyHoliday[];
  error?: string;
}

export type TimeOffDataResponse = TimeOffPageData;


// 1. Fetch complete Time Off dashboard data
export async function getTimeOffDataAction(selectedYear?: number): Promise<TimeOffPageData> {
  const supabase = await createClient();
  const adminClient = createAdminClient();
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

  const { data: currentProfile, error: profErr } = await adminClient
    .from('profiles')
    .select('*, company:companies(*), department:departments(name)')
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
  const year = selectedYear || new Date().getFullYear();

  // Fetch all 3 queries in parallel using adminClient
  let requestsQuery = adminClient
    .from('time_off_requests')
    .select('*, profile:profiles(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    requestsQuery = requestsQuery.eq('profile_id', user.id);
  }

  const [allocRes, requestsRes, holidaysRes] = await Promise.all([
    adminClient
      .from('time_off_allocations')
      .select('*')
      .eq('profile_id', user.id)
      .eq('year', year)
      .maybeSingle(),

    requestsQuery,

    adminClient
      .from('company_holidays')
      .select('*')
      .eq('company_id', companyId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: true }),
  ]);

  return {
    success: true,
    currentUserProfile: currentProfile as Profile,
    isAdmin,
    allocation: (allocRes.data || {
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
    requests: (requestsRes.data || []) as TimeOffRequest[],
    holidays: (holidaysRes.data || []) as CompanyHoliday[],
  };
}

// 2. Submit Time Off Request
export async function submitTimeOffRequestAction(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await adminClient
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

  let attachmentUrl: string | null = null;
  if (attachmentFile && attachmentFile.size > 0) {
    const fileExt = attachmentFile.name.split('.').pop();
    const fileName = `leave-doc-${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(fileName, attachmentFile, { contentType: attachmentFile.type, upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = adminClient.storage.from('documents').getPublicUrl(fileName);
      attachmentUrl = publicUrlData.publicUrl;
    }
  }

  const { error: insertError } = await adminClient
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

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath('/time-off');
  return { success: true };
}

// 3. Review Time Off Request (Approve / Reject)
export async function reviewTimeOffRequestAction(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewerComments?: string
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: reviewerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!reviewerProfile || !['admin', 'hr_officer'].includes(reviewerProfile.role)) {
    return { success: false, error: 'Permission denied. Admin or HR access required.' };
  }

  const { error } = await adminClient
    .from('time_off_requests')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewer_comments: reviewerComments || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/time-off');
  return { success: true };
}

// 4. Approve Leave Action
export async function approveLeaveAction(requestId: string, comments?: string) {
  return reviewTimeOffRequestAction(requestId, 'approved', comments);
}

// 5. Reject Leave Action
export async function rejectLeaveAction(requestId: string, comments?: string) {
  return reviewTimeOffRequestAction(requestId, 'rejected', comments);
}

