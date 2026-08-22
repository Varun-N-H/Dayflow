'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import { getAttendanceAction, punchInAction, punchOutAction, AttendanceResponse } from '@/app/actions/attendance';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatHours, formatTime, formatDate } from '@/lib/utils/formatters';
import { 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  User, 
  Building2,
  AlertCircle
} from 'lucide-react';

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading Attendance...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}

function AttendanceContent() {
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Date and View State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  async function loadData(dateToLoad = selectedDate, mode = viewMode) {
    setLoading(true);
    setError(null);
    const res = await getAttendanceAction(dateToLoad, mode);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to load attendance records.');
    } else {
      setData(res);
    }
  }

  useEffect(() => {
    loadData(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

  // Date Navigation handlers
  function handlePrevDate() {
    if (viewMode === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      const newDate = d.toISOString().split('T')[0];
      setSelectedDate(newDate);
    } else {
      const [y, m] = selectedDate.split('-').map(Number);
      const prevM = m === 1 ? 12 : m - 1;
      const prevY = m === 1 ? y - 1 : y;
      const newMonth = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      setSelectedDate(newMonth);
    }
  }

  function handleNextDate() {
    if (viewMode === 'day') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      const newDate = d.toISOString().split('T')[0];
      setSelectedDate(newDate);
    } else {
      const [y, m] = selectedDate.split('-').map(Number);
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      const newMonth = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
      setSelectedDate(newMonth);
    }
  }

  // Punch In / Punch Out Handlers
  async function handlePunchIn() {
    setActionLoading(true);
    const res = await punchInAction();
    setActionLoading(false);
    if (res.success) {
      loadData();
    } else {
      setError(res.error || 'Failed to record check in.');
    }
  }

  async function handlePunchOut() {
    setActionLoading(true);
    const res = await punchOutAction();
    setActionLoading(false);
    if (res.success) {
      loadData();
    } else {
      setError(res.error || 'Failed to record check out.');
    }
  }

  const isCheckedIn = !!(data?.todayRecord?.check_in && !data?.todayRecord?.check_out);
  const isAdmin = !!data?.isAdmin;

  // Filter Admin Rows
  const filteredAdminRows = (data?.adminRows || []).filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = `${r.profile.first_name} ${r.profile.last_name}`.toLowerCase();
    const loginId = (r.profile.login_id || '').toLowerCase();
    return name.includes(q) || loginId.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar initialProfile={data?.currentUserProfile} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header & Controls Bar (Wireframe five.png) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            
            {/* Title & Date Navigation */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {formatDate(selectedDate, 'long')}
                  </p>
                </div>
              </div>

              {/* Date Navigators */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                  <button
                    onClick={handlePrevDate}
                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-l-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-200" />
                  <button
                    onClick={handleNextDate}
                    className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-r-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type={viewMode === 'month' ? 'month' : 'date'}
                  value={viewMode === 'month' ? selectedDate.substring(0, 7) : selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none cursor-pointer"
                />

                {isAdmin && (
                  <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
                    <button
                      onClick={() => setViewMode('day')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'day' ? 'bg-white text-purple-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'month' ? 'bg-white text-purple-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Month
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary KPI Metrics (AttendanceStats component from teammate) */}
            {data?.stats && (
              <AttendanceStats
                daysPresent={data.stats.daysPresent}
                leavesCount={data.stats.leavesCount}
                totalWorkingDays={data.stats.totalWorkingDays}
              />
            )}

          </div>

          {/* Quick Punch In/Out Card */}
          <div className="clean-card rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {isCheckedIn ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Today's Attendance Status:</span>
                  <Badge variant={isCheckedIn ? 'success' : 'danger'}>
                    {isCheckedIn ? 'Checked IN (Active Shift)' : 'Checked OUT'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {data?.todayRecord?.check_in
                    ? `First Check In: ${formatTime(data.todayRecord.check_in)} ${
                        data.todayRecord.check_out ? `• Check Out: ${formatTime(data.todayRecord.check_out)}` : ''
                      }`
                    : 'No check-in recorded for today yet.'}
                </p>
              </div>
            </div>

            <div>
              {isCheckedIn ? (
                <Button
                  variant="outline"
                  size="md"
                  isLoading={actionLoading}
                  onClick={handlePunchOut}
                  className="font-bold border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Check Out &rarr;
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={actionLoading}
                  onClick={handlePunchIn}
                  className="font-bold shadow-md shadow-purple-600/30"
                >
                  <LogIn className="h-4 w-4" /> Check IN &rarr;
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar for Admin */}
          {isAdmin && viewMode === 'day' && (
            <div className="relative w-full max-w-md mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees by name or login ID..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Data Table */}
          <div className="clean-card rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            
            {/* 1. Admin Day-Wise Ledger Table (Wireframe five.png) */}
            {isAdmin && viewMode === 'day' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-6">Emp</th>
                      <th className="py-3.5 px-4">Check In</th>
                      <th className="py-3.5 px-4">Check Out</th>
                      <th className="py-3.5 px-4">Work Hours</th>
                      <th className="py-3.5 px-4">Extra hours</th>
                      <th className="py-3.5 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredAdminRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No employee records found for this date.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminRows.map((row) => (
                        <tr key={row.profile.id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* Emp Column: Avatar + Name + Login ID */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {row.profile.avatar_url ? (
                                <img
                                  src={row.profile.avatar_url}
                                  alt={row.profile.first_name}
                                  className="h-9 w-9 rounded-lg object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 font-bold text-xs text-purple-700">
                                  {row.profile.first_name[0]}{row.profile.last_name[0]}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{row.profile.first_name} {row.profile.last_name}</p>
                                <p className="font-mono text-[10px] text-slate-400">{row.profile.login_id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Check In */}
                          <td className="py-3.5 px-4 font-mono font-medium">
                            {formatTime(row.attendance?.check_in)}
                          </td>

                          {/* Check Out */}
                          <td className="py-3.5 px-4 font-mono font-medium">
                            {formatTime(row.attendance?.check_out)}
                          </td>

                          {/* Work Hours */}
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            {formatHours(row.attendance?.work_hours)}
                          </td>

                          {/* Extra Hours */}
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {formatHours(row.attendance?.extra_hours)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-6 text-right">
                            {row.status === 'present' && <Badge variant="success">Present</Badge>}
                            {row.status === 'on_leave' && <Badge variant="primary">On Leave</Badge>}
                            {row.status === 'half_day' && <Badge variant="warning">Half Day</Badge>}
                            {row.status === 'absent' && <Badge variant="danger">Absent</Badge>}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* 2. Employee Monthly Ledger Table (Wireframe five.png) */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-4">Check In</th>
                      <th className="py-3.5 px-4">Check Out</th>
                      <th className="py-3.5 px-4">Work Hours</th>
                      <th className="py-3.5 px-4">Extra hours</th>
                      <th className="py-3.5 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {(data?.employeeRecords || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No attendance records found for this month.
                        </td>
                      </tr>
                    ) : (
                      (data?.employeeRecords || []).map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-slate-900">
                            {formatDate(rec.date)}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {formatTime(rec.check_in)}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {formatTime(rec.check_out)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            {formatHours(rec.work_hours)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {formatHours(rec.extra_hours)}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {rec.status === 'present' && <Badge variant="success">Present</Badge>}
                            {rec.status === 'half_day' && <Badge variant="warning">Half Day</Badge>}
                            {rec.status === 'absent' && <Badge variant="danger">Absent</Badge>}
                            {rec.status === 'on_leave' && <Badge variant="primary">On Leave</Badge>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </main>
      </div>

      <footer className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 text-center">
        Dayflow HRMS &copy; 2026. Automated Attendance & Payroll Baseline Engine.
      </footer>
    </div>
  );
}
