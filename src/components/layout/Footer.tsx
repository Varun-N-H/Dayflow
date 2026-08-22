import React from 'react';
import { Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <span className="font-semibold text-slate-700">Dayflow HRMS</span>
        <span>&bull; Every workday, perfectly aligned.</span>
      </div>

      <div className="flex items-center gap-6">
        <Link href="/employees" className="hover:text-purple-600 transition-colors">Directory</Link>
        <Link href="/attendance" className="hover:text-purple-600 transition-colors">Attendance</Link>
        <Link href="/time-off" className="hover:text-purple-600 transition-colors">Time Off</Link>
        <Link href="/profile" className="hover:text-purple-600 transition-colors flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
      </div>
    </footer>
  );
}
