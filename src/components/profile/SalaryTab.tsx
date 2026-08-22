'use client';

import React, { useState } from 'react';
import { SalaryStructure } from '@/types/database.types';
import { updateSalaryStructureAction } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';
import { IndianRupee, Calculator, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface SalaryTabProps {
  profileId: string;
  salaryStructure: SalaryStructure | null;
  isAdmin: boolean;
}

export function SalaryTab({ profileId, salaryStructure, isAdmin }: SalaryTabProps) {
  const [monthlyWage, setMonthlyWage] = useState<number>(salaryStructure?.monthly_wage || 50000);
  const [workingDays, setWorkingDays] = useState<number>(salaryStructure?.working_days_per_week || 5);
  const [breakTime, setBreakTime] = useState<number>(salaryStructure?.break_time_hours || 1.0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-900">Confidential Information</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Salary structures and compensation data are strictly restricted to Administrators and HR Officers.
        </p>
      </div>
    );
  }

  // Live Reactive Calculations (Strictly matching Wireframe 4 rules)
  const yearlyWage = monthlyWage * 12;
  const basicSalary = monthlyWage * 0.50; // 50% of Wage
  const hra = basicSalary * 0.50; // 50% of Basic
  const standardAllowance = 4167.00; // Fixed flat amount
  const performanceBonus = basicSalary * 0.0833; // 8.33% of Basic
  const lta = basicSalary * 0.0833; // 8.33% of Basic
  
  // Residual Fixed Allowance balancing component
  const computedFixedAllowance = Math.max(
    0,
    monthlyWage - (basicSalary + hra + standardAllowance + performanceBonus + lta)
  );

  // Statutory Deductions & Contributions
  const employeePf = basicSalary * 0.12; // 12% of Basic
  const employerPf = basicSalary * 0.12; // 12% of Basic
  const professionalTax = 200.00; // Flat ₹200/month

  const totalDeductions = employeePf + professionalTax;
  const netTakeHome = monthlyWage - totalDeductions;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('monthlyWage', String(monthlyWage));
    formData.append('workingDays', String(workingDays));
    formData.append('breakTime', String(breakTime));

    const res = await updateSalaryStructureAction(profileId, formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to update salary structure.');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Overview Top Header Row (Wireframe three.png / four.png) */}
      <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Salary & Compensation Engine</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Monthly Wage Input */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
            <label className="block text-xs font-bold text-purple-900 mb-1">Month Wage</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-purple-700">₹</span>
              <input
                type="number"
                value={monthlyWage}
                onChange={(e) => setMonthlyWage(Math.max(0, Number(e.target.value)))}
                step={500}
                className="w-full font-mono font-bold text-base text-slate-900 bg-white border border-purple-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
              />
            </div>
            <span className="text-[10px] text-purple-600 font-semibold mt-1 block">/ Month</span>
          </div>

          {/* Yearly Wage Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
            <label className="block text-xs font-semibold text-slate-600">Yearly Wage</label>
            <p className="font-mono text-base font-bold text-slate-900">
              ₹ {yearlyWage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-500 font-medium">/ Yearly (12 Months)</span>
          </div>

          {/* Working Days per Week */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
            <label className="block text-xs font-semibold text-slate-600">No of working days in a week</label>
            <input
              type="number"
              value={workingDays}
              onChange={(e) => setWorkingDays(Number(e.target.value))}
              min={1}
              max={7}
              className="w-full font-mono font-bold text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1"
            />
            <span className="text-[10px] text-slate-500 font-medium">Days schedule</span>
          </div>

          {/* Break Time */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col justify-between">
            <label className="block text-xs font-semibold text-slate-600">Break Time</label>
            <input
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(Number(e.target.value))}
              step={0.25}
              min={0}
              className="w-full font-mono font-bold text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1"
            />
            <span className="text-[10px] text-slate-500 font-medium">/ hrs</span>
          </div>

        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          Salary structure updated and saved successfully.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Two Column Detailed Breakdown (Wireframe four.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Sub-Column: Salary Components */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Salary Components</h4>
            <span className="text-[11px] font-semibold text-purple-600">Dynamic Auto-Calculations</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* 1. Basic Salary */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Basic Salary</p>
                <p className="text-[11px] text-slate-400">50.00 % of Monthly Wage</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-900">
                ₹ {basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* 2. HRA */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">House Rent Allowance (HRA)</p>
                <p className="text-[11px] text-slate-400">50.00 % of Basic Salary</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-900">
                ₹ {hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* 3. Standard Allowance */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Standard Allowance</p>
                <p className="text-[11px] text-slate-400">Fixed Predetermined Amount</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-900">
                ₹ {standardAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* 4. Performance Bonus */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Performance Bonus</p>
                <p className="text-[11px] text-slate-400">8.33 % of Basic Salary</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-900">
                ₹ {performanceBonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* 5. Leave Travel Allowance (LTA) */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Leave Travel Allowance (LTA)</p>
                <p className="text-[11px] text-slate-400">8.33 % of Basic Salary</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-900">
                ₹ {lta.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* 6. Fixed Allowance */}
            <div className="flex justify-between items-center py-2 bg-purple-50/60 px-3 rounded-lg border border-purple-100">
              <div>
                <p className="font-bold text-purple-900">Fixed Allowance</p>
                <p className="text-[11px] text-purple-600">Auto-calculated Residual Balancing Component</p>
              </div>
              <p className="font-mono font-bold text-sm text-purple-900">
                ₹ {computedFixedAllowance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-purple-600 font-normal">/ month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Sub-Column: Contributions & Statutory Deductions */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Statutory Deductions & PF</h4>
            <span className="text-[11px] font-semibold text-rose-600">Compliance</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Employee PF */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Provident Fund (Employee PF)</p>
                <p className="text-[11px] text-slate-400">12.00 % of Basic Salary</p>
              </div>
              <p className="font-mono font-bold text-sm text-rose-600">
                - ₹ {employeePf.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* Employer PF */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Employer PF Contribution</p>
                <p className="text-[11px] text-slate-400">12.00 % of Basic Salary (Company Cost)</p>
              </div>
              <p className="font-mono font-bold text-sm text-slate-700">
                ₹ {employerPf.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* Professional Tax */}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Professional Tax (PT)</p>
                <p className="text-[11px] text-slate-400">Flat State Statutory Deduction</p>
              </div>
              <p className="font-mono font-bold text-sm text-rose-600">
                - ₹ {professionalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/ month</span>
              </p>
            </div>

            {/* Net Estimated Take Home */}
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-emerald-950 text-sm">Estimated Net Monthly In-Hand</p>
                <p className="text-[11px] text-emerald-700">Monthly Gross minus statutory deductions</p>
              </div>
              <p className="font-mono font-bold text-lg text-emerald-950">
                ₹ {netTakeHome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Save Button Footer */}
      <div className="flex justify-end pt-4">
        <Button type="submit" variant="primary" size="lg" isLoading={loading} className="px-8 font-bold shadow-md shadow-purple-600/20">
          Save Salary Structure
        </Button>
      </div>

    </form>
  );
}
