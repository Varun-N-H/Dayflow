'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import { 
  getTimeOffDataAction, 
  submitTimeOffRequestAction, 
  approveLeaveAction, 
  rejectLeaveAction, 
  TimeOffDataResponse 
} from '@/app/actions/time-off';
import { AnnualCalendarGrid } from '@/components/time-off/AnnualCalendarGrid';
import { TimeOffModal } from '@/components/modals/TimeOffModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/formatters';
import { 
  Calendar, 
  Plus, 
  Search, 
  Check, 
  X, 
  FileText, 
  AlertCircle, 
  CalendarDays, 
  HeartHandshake, 
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function TimeOffPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading Time Off...</div>}>
      <TimeOffContent />
    </Suspense>
  );
}

function TimeOffContent() {
  const [data, setData] = useState<TimeOffDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'time_off' | 'allocation'>('time_off');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  async function loadData() {
    setLoading(true);
    setError(null);
    const res = await getTimeOffDataAction(currentYear);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to load time off data.');
    } else {
      setData(res);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle Date Click on 12-Month Calendar
  function handleCalendarDateSelect(dateStr: string) {
    setPreselectedDate(dateStr);
    setIsModalOpen(true);
  }

  // Handle Leave Request Submission
  async function handleSubmitRequest(formData: FormData) {
    const res = await submitTimeOffRequestAction(formData);
    if (res.success) {
      loadData();
    }
    return res;
  }

  // Handle Leave Approval
  async function handleApprove(id: string) {
    setActionId(id);
    const res = await approveLeaveAction(id);
    setActionId(null);
    if (res.success) {
      loadData();
    } else {
      setError(res.error || 'Failed to approve leave request.');
    }
  }

  // Handle Leave Rejection
  async function handleReject(id: string) {
    setActionId(id);
    const res = await rejectLeaveAction(id);
    setActionId(null);
    if (res.success) {
      loadData();
    } else {
      setError(res.error || 'Failed to reject leave request.');
    }
  }

  const isAdmin = !!data?.isAdmin;
  const allocation = data?.allocation;
  const employeeName = data?.currentUserProfile 
    ? `${data.currentUserProfile.first_name} ${data.currentUserProfile.last_name}` 
    : 'Employee';

  const paidDaysAvailable = Math.max(0, (allocation?.paid_time_off_allocated || 24) - (allocation?.paid_time_off_used || 0));
  const sickDaysAvailable = Math.max(0, (allocation?.sick_leave_allocated || 7) - (allocation?.sick_leave_used || 0));

  // Filter requests for Admin search
  const filteredRequests = (data?.requests || []).filter((req) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = req.profile ? `${req.profile.first_name} ${req.profile.last_name}`.toLowerCase() : '';
    const type = req.time_off_type.replace('_', ' ').toLowerCase();
    const status = req.status.toLowerCase();
    return name.includes(q) || type.includes(q) || status.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar initialProfile={data?.currentUserProfile} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Sub-Header & Controls Bar (Wireframe six.png) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            
            {/* Left: Navigation Tabs + NEW Button */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setPreselectedDate(undefined);
                  setIsModalOpen(true);
                }}
                className="font-bold uppercase tracking-wider px-5 py-2 shadow-sm shadow-purple-600/30"
              >
                <Plus className="h-4 w-4" /> NEW
              </Button>

              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => setActiveTab('time_off')}
                  className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'time_off' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Time Off
                </button>
                <button
                  onClick={() => setActiveTab('allocation')}
                  className={`px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'allocation' ? 'bg-purple-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Allocation
                </button>
              </div>
            </div>

            {/* Right: Company Balance Quota Badges (Wireframe six.png top-right) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Paid time off quota */}
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 shadow-2xs">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Paid time Off</p>
                  <p className="text-xs font-bold text-blue-950 font-mono">
                    {String(paidDaysAvailable).padStart(2, '0')} Days Available
                  </p>
                </div>
              </div>

              {/* Sick time off quota */}
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2 shadow-2xs">
                <HeartHandshake className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Sick time off</p>
                  <p className="text-xs font-bold text-blue-950 font-mono">
                    {String(sickDaysAvailable).padStart(2, '0')} Days Available
                  </p>
                </div>
              </div>
            </div>

          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Time Off Surface */}
          {activeTab === 'time_off' && (
            <div className="space-y-8">
              
              {/* 1. Admin Review & Approvals Queue (Wireframe six.png) */}
              {isAdmin && (
                <div className="clean-card rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Leave Requests & Approvals Queue</h2>
                      <p className="text-xs text-slate-500">Review employee leave applications and grant approvals</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter requests..."
                        className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3.5 px-6">Name</th>
                          <th className="py-3.5 px-4">Start Date</th>
                          <th className="py-3.5 px-4">End Date</th>
                          <th className="py-3.5 px-4">Time off Type</th>
                          <th className="py-3.5 px-4">Attachment</th>
                          <th className="py-3.5 px-6 text-right">Status / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {filteredRequests.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No leave requests in queue.
                            </td>
                          </tr>
                        ) : (
                          filteredRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                              
                              {/* Employee Name */}
                              <td className="py-3.5 px-6 font-bold text-slate-900">
                                {req.profile ? `${req.profile.first_name} ${req.profile.last_name}` : 'Employee'}
                              </td>

                              {/* Dates */}
                              <td className="py-3.5 px-4 font-mono font-medium">{formatDate(req.start_date)}</td>
                              <td className="py-3.5 px-4 font-mono font-medium">{formatDate(req.end_date)}</td>

                              {/* Time Off Type */}
                              <td className="py-3.5 px-4">
                                <span className="capitalize font-semibold text-slate-700">
                                  {req.time_off_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  ({req.allocation_days} {req.allocation_days === 1 ? 'day' : 'days'})
                                </span>
                              </td>

                              {/* Attachment Link */}
                              <td className="py-3.5 px-4">
                                {req.attachment_url ? (
                                  <a
                                    href={req.attachment_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:underline text-xs"
                                  >
                                    <FileText className="h-3.5 w-3.5" /> View Medical Note <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>

                              {/* Status / Review Actions */}
                              <td className="py-3.5 px-6 text-right">
                                {req.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Reject Button (Red) */}
                                    <button
                                      disabled={actionId === req.id}
                                      onClick={() => handleReject(req.id)}
                                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" /> Reject
                                    </button>

                                    {/* Approve Button (Green) */}
                                    <button
                                      disabled={actionId === req.id}
                                      onClick={() => handleApprove(req.id)}
                                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Approve
                                    </button>
                                  </div>
                                ) : (
                                  <Badge variant={req.status === 'approved' ? 'success' : 'danger'}>
                                    {req.status === 'approved' ? 'Approved' : 'Rejected'}
                                  </Badge>
                                )}
                              </td>

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Interactive 12-Month Calendar Grid (Wireframe six.png) */}
              <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Annual Leave & Holiday Calendar ({currentYear})</h2>
                      <p className="text-xs text-slate-500">Interactive year-at-a-glance schedule</p>
                    </div>
                  </div>
                </div>

                <AnnualCalendarGrid
                  year={currentYear}
                  requests={data?.requests || []}
                  holidays={data?.holidays || []}
                  onSelectDate={handleCalendarDateSelect}
                />
              </div>

            </div>
          )}

          {/* Tab 2: Allocation Surface */}
          {activeTab === 'allocation' && (
            <div className="clean-card rounded-2xl p-8 bg-white border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Annual Leave Quota Allocation ({currentYear})</h3>
                <p className="text-xs text-slate-500">Official statutory entitlement and consumed balance</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">Paid Time Off (PTO)</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold font-mono text-purple-950">{paidDaysAvailable}</span>
                    <span className="text-xs text-purple-700">/ {allocation?.paid_time_off_allocated || 24} Total Days</span>
                  </div>
                  <p className="text-[11px] text-purple-600 mt-2">Consumed: {allocation?.paid_time_off_used || 0} days</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">Sick Leave</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold font-mono text-blue-950">{sickDaysAvailable}</span>
                    <span className="text-xs text-blue-700">/ {allocation?.sick_leave_allocated || 7} Total Days</span>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-2">Consumed: {allocation?.sick_leave_used || 0} days</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Unpaid Leaves</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold font-mono text-slate-900">{allocation?.unpaid_leaves_taken || 0}</span>
                    <span className="text-xs text-slate-500">Days Taken</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Loss of pay days deducted in payroll</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <footer className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 text-center">
        Dayflow HRMS &copy; 2026. Time Off & Leave Management Engine.
      </footer>

      {/* Time Off Modal */}
      <TimeOffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitRequest}
        employeeName={employeeName}
        defaultStartDate={preselectedDate}
        defaultEndDate={preselectedDate}
      />
    </div>
  );
}
