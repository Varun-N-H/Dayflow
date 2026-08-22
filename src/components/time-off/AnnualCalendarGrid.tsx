'use client';

import React from 'react';
import { TimeOffRequest, CompanyHoliday } from '@/types/database.types';

interface AnnualCalendarGridProps {
  year: number;
  requests: TimeOffRequest[];
  holidays: CompanyHoliday[];
  onSelectDate: (dateStr: string) => void;
}

export function AnnualCalendarGrid({
  year,
  requests,
  holidays,
  onSelectDate,
}: AnnualCalendarGridProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map of Holiday dates -> Name
  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.name));

  // Map of Leave dates -> { status: 'approved' | 'pending', type: string }
  const leaveMap = new Map<string, { status: string; type: string }>();
  requests.forEach((req) => {
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);
    const cur = new Date(start);

    while (cur <= end) {
      const dStr = cur.toISOString().split('T')[0];
      leaveMap.set(dStr, { status: req.status, type: req.time_off_type });
      cur.setDate(cur.getDate() + 1);
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-3 w-3 rounded-full bg-purple-600" />
          <span>Approved Leave</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span>Pending Request</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Company Holiday</span>
        </div>
        <div className="text-slate-400 ml-auto hidden sm:block">
          💡 Click any date on the calendar to apply for time off
        </div>
      </div>

      {/* 12-Month Calendar Grid (3x4 or 4x3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {months.map((monthName, monthIndex) => {
          const firstDayOfMonth = new Date(year, monthIndex, 1).getDay(); // 0 = Sun
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

          // Generate calendar cells
          const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

          return (
            <div
              key={monthName}
              className="clean-card rounded-2xl p-4 bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Month Header */}
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2 text-center uppercase tracking-wider">
                {monthName}
              </h4>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                {blanks.map((b) => (
                  <div key={`blank-${b}`} className="h-7 w-7" />
                ))}

                {days.map((day) => {
                  const mStr = String(monthIndex + 1).padStart(2, '0');
                  const dStr = String(day).padStart(2, '0');
                  const dateKey = `${year}-${mStr}-${dStr}`;

                  const isHoliday = holidayMap.has(dateKey);
                  const leave = leaveMap.get(dateKey);

                  let cellStyle = 'text-slate-700 hover:bg-purple-50 hover:text-purple-700';

                  if (leave?.status === 'approved') {
                    cellStyle = 'bg-purple-600 text-white font-bold shadow-xs';
                  } else if (leave?.status === 'pending') {
                    cellStyle = 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
                  } else if (isHoliday) {
                    cellStyle = 'bg-blue-50 text-blue-700 font-bold border border-blue-200';
                  }

                  return (
                    <button
                      key={day}
                      onClick={() => onSelectDate(dateKey)}
                      title={isHoliday ? `Holiday: ${holidayMap.get(dateKey)}` : `Click to request leave on ${dateKey}`}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs ${cellStyle}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
