'use client';

import React, { useState } from 'react';
import { updatePasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface SecurityTabProps {
  isTemporaryPassword?: boolean;
}

export function SecurityTab({ isTemporaryPassword = false }: SecurityTabProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updatePasswordAction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to update password.');
    } else {
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <div className="max-w-xl">
      <div className="clean-card rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xs space-y-6">
        
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Security & Password Management</h3>
            <p className="text-xs text-slate-500">Update your account credentials and manage session security</p>
          </div>
        </div>

        {isTemporaryPassword && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Action Required: Change Temporary Password</p>
              <p className="mt-0.5">
                You are currently signed in with a system-generated temporary password. Please set a permanent password to secure your account.
              </p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            Password updated successfully!
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-slate-300 p-2.5 pr-10 text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
            <input
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" isLoading={loading} className="w-full py-2.5 font-bold">
              Update Password
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
