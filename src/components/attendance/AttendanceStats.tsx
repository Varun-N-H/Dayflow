import React from 'react';
import { CalendarCheck, CalendarX, Briefcase } from 'lucide-react';

export interface AttendanceStatsProps {
  daysPresent: number;
  leavesCount: number;
  totalWorkingDays: number;
}

export function AttendanceStats({
  daysPresent,
  leavesCount,
  totalWorkingDays,
}: AttendanceStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 1. Count of days present */}
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <CalendarCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-emerald-800">Count of days present</p>
          <p className="text-base font-bold text-emerald-950 tabular-nums">{daysPresent}</p>
        </div>
      </div>

      {/* 2. Leaves count */}
      <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/60 px-3.5 py-2 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
          <CalendarX className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-purple-800">Leaves count</p>
          <p className="text-base font-bold text-purple-950 tabular-nums">{leavesCount}</p>
        </div>
      </div>

      {/* 3. Total working days */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Briefcase className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-600">Total working days</p>
          <p className="text-base font-bold text-slate-900 tabular-nums">{totalWorkingDays}</p>
        </div>
      </div>
    </div>
  );
}
