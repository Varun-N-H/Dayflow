'use client';

import React, { useState } from 'react';
import { createEmployeeAction } from '@/app/actions/employees';
import { Button } from '@/components/ui/Button';
import { X, Sparkles, CheckCircle2, Copy, AlertCircle, UserPlus } from 'lucide-react';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeModal({ isOpen, onClose, onSuccess }: NewEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{
    loginId: string;
    temporaryPassword: string;
    employeeName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await createEmployeeAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to create employee profile.');
    } else {
      setCreatedInfo({
        loginId: res.loginId || '',
        temporaryPassword: res.temporaryPassword || '',
        employeeName: res.employeeName || '',
      });
      onSuccess();
    }
  }

  function handleCopyCredentials() {
    if (!createdInfo) return;
    const text = `Dayflow HRMS Credentials:\nEmployee: ${createdInfo.employeeName}\nLogin ID: ${createdInfo.loginId}\nTemporary Password: ${createdInfo.temporaryPassword}\nLogin URL: ${window.location.origin}/signin`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Employee</h2>
              <p className="text-xs text-slate-500">Auto-generates deterministic Login ID & credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success View */}
        {createdInfo ? (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Employee Successfully Provisioned!</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The employee account has been created. Please share these credentials:
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-xs">Employee:</span>
                <span className="font-bold text-slate-900">{createdInfo.employeeName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-xs">Login ID:</span>
                <span className="font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                  {createdInfo.loginId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans text-xs">Temp Password:</span>
                <span className="font-bold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded">
                  {createdInfo.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopyCredentials}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setCreatedInfo(null);
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  placeholder="e.g. John"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  placeholder="e.g. Doe"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
              <input
                name="email"
                type="email"
                required
                placeholder="john.doe@company.com"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position *</label>
                <input
                  name="jobPosition"
                  type="text"
                  required
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  name="department"
                  type="text"
                  placeholder="e.g. Engineering"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Wage (₹)</label>
                <input
                  name="monthlyWage"
                  type="number"
                  defaultValue={50000}
                  step={1000}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Provision Employee
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
