import React from 'react';
import Link from 'next/link';
import { EmployeeWithLiveStatus } from '@/app/actions/employees';
import { Plane, Mail, Phone, Building2 } from 'lucide-react';

interface EmployeeCardProps {
  employee: EmployeeWithLiveStatus;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  // Render status badge for top-right corner
  function renderStatusBadge() {
    if (employee.liveStatus === 'present') {
      return (
        <span 
          title="Present in Office"
          className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-xs"
        />
      );
    }
    if (employee.liveStatus === 'on_leave') {
      return (
        <span 
          title="On Approved Leave"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 shadow-xs"
        >
          <Plane className="h-3 w-3" />
        </span>
      );
    }
    return (
      <span 
        title="Absent"
        className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 ring-4 ring-amber-50 shadow-xs"
      />
    );
  }

  const initials = `${employee.first_name?.[0] || 'E'}${employee.last_name?.[0] || 'M'}`;

  return (
    <Link 
      href={`/profile?id=${employee.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md cursor-pointer"
    >
      {/* Top-Right Status Badge */}
      <div className="absolute right-4 top-4">
        {renderStatusBadge()}
      </div>

      <div className="flex items-start gap-4">
        {/* Profile Picture / Avatar */}
        <div className="relative shrink-0">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={`${employee.first_name} ${employee.last_name}`}
              className="h-14 w-14 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:border-purple-300 transition-colors"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-base font-bold text-purple-700 shadow-xs group-hover:bg-purple-100 transition-colors">
              {initials}
            </div>
          )}
        </div>

        {/* Core Employee Details */}
        <div className="min-w-0 flex-1 pr-6">
          <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="truncate text-xs font-semibold text-purple-600 mt-0.5">
            {employee.job_position || 'Team Member'}
          </p>
          <p className="font-mono text-[11px] text-slate-400 mt-1">
            {employee.login_id}
          </p>
        </div>
      </div>

      {/* Footer Info Row: Department & Contacts */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 font-medium truncate max-w-[150px]">
          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {employee.department?.name || employee.work_location || 'General'}
        </span>

        <span className="text-[11px] font-semibold text-slate-400 capitalize">
          {employee.role === 'admin' ? 'Admin' : employee.role === 'hr_officer' ? 'HR' : 'Employee'}
        </span>
      </div>
    </Link>
  );
}
