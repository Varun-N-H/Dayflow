'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { X, Printer, Download, Sparkles, Building2 } from 'lucide-react';
import { Profile, SalaryStructure } from '@/types/database.types';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  salaryStructure: SalaryStructure | null;
  monthName: string;
  year: number;
  payableDays: number;
  totalWorkingDays: number;
}

export function PayslipModal({
  isOpen,
  onClose,
  profile,
  salaryStructure,
  monthName,
  year,
  payableDays,
  totalWorkingDays,
}: PayslipModalProps) {
  if (!isOpen || !salaryStructure) return null;

  // Prorated calculations based on payable days
  const prorationRatio = totalWorkingDays > 0 ? Math.min(1, payableDays / totalWorkingDays) : 1;
  const basic = (salaryStructure.basic_salary || 25000) * prorationRatio;
  const hra = (salaryStructure.hra || 12500) * prorationRatio;
  const standard = (salaryStructure.standard_allowance || 4167) * prorationRatio;
  const bonus = (salaryStructure.performance_bonus || 2082.5) * prorationRatio;
  const lta = (salaryStructure.leave_travel_allowance || 2082.5) * prorationRatio;
  const fixed = (salaryStructure.fixed_allowance || 2918) * prorationRatio;

  const grossEarnings = basic + hra + standard + bonus + lta + fixed;

  const pfEmployee = (salaryStructure.employee_pf || 3000) * prorationRatio;
  const pt = salaryStructure.professional_tax || 200;
  const totalDeductions = pfEmployee + pt;
  const netPay = grossEarnings - totalDeductions;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Payslip Preview</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Document */}
        <div className="space-y-6">
          
          {/* Org Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{profile.company?.name || 'Dayflow HRMS'}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Payslip for {monthName} {year}</p>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                {profile.login_id}
              </span>
            </div>
          </div>

          {/* Employee Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Employee Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{profile.first_name} {profile.last_name}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Designation</span>
              <p className="font-bold text-slate-900 mt-0.5">{profile.job_position || 'Staff'}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Payable Days</span>
              <p className="font-mono font-bold text-purple-700 mt-0.5">{payableDays} / {totalWorkingDays}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Pay Period</span>
              <p className="font-bold text-slate-900 mt-0.5">{monthName} {year}</p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            
            {/* Earnings */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-900 border-b border-slate-200">
                Earnings
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(basic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">HRA</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Standard Allowance</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(standard)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Performance Bonus</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(bonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">LTA</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(lta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fixed Allowance</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(fixed)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Gross Earnings</span>
                  <span className="font-mono text-purple-700">{formatCurrency(grossEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-900 border-b border-slate-200">
                Deductions
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Provident Fund (PF)</span>
                  <span className="font-mono font-bold text-rose-600">-{formatCurrency(pfEmployee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Professional Tax (PT)</span>
                  <span className="font-mono font-bold text-rose-600">-{formatCurrency(pt)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-600">-{formatCurrency(totalDeductions)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Net Pay Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Net Take Home Pay</p>
              <p className="text-[11px] text-emerald-600">Transferred to registered bank account</p>
            </div>
            <p className="font-mono font-bold text-xl text-emerald-950">
              {formatCurrency(netPay)}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
