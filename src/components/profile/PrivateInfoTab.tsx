'use client';

import React, { useState } from 'react';
import { EmployeePrivateInfo } from '@/types/database.types';
import { updatePrivateInfoAction } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';
import { User, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface PrivateInfoTabProps {
  profileId: string;
  privateInfo: EmployeePrivateInfo | null;
  canEdit: boolean;
}

export function PrivateInfoTab({ profileId, privateInfo, canEdit }: PrivateInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await updatePrivateInfoAction(profileId, formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to save private info.');
    } else {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Private & Statutory Information</h3>
          <p className="text-xs text-slate-500">Confidential personal records, bank details, and statutory tax IDs</p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Details
          </Button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          Private information updated successfully.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Personal & Contact Details */}
          <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <User className="h-4 w-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Personal Details</h4>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              {isEditing ? (
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={privateInfo?.date_of_birth || ''}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{privateInfo?.date_of_birth || '—'}</p>
              )}
            </div>

            {/* Residing Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residing Address</label>
              {isEditing ? (
                <textarea
                  name="residingAddress"
                  rows={2}
                  defaultValue={privateInfo?.residing_address || ''}
                  placeholder="Street address, city, state, postal code"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{privateInfo?.residing_address || '—'}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality</label>
              {isEditing ? (
                <input
                  name="nationality"
                  type="text"
                  defaultValue={privateInfo?.nationality || 'Indian'}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{privateInfo?.nationality || 'Indian'}</p>
              )}
            </div>

            {/* Personal Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Email</label>
              {isEditing ? (
                <input
                  name="personalEmail"
                  type="email"
                  defaultValue={privateInfo?.personal_email || ''}
                  placeholder="personal@email.com"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{privateInfo?.personal_email || '—'}</p>
              )}
            </div>

            {/* Gender & Marital Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                {isEditing ? (
                  <select
                    name="gender"
                    defaultValue={privateInfo?.gender || 'prefer_not_to_say'}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 capitalize">{privateInfo?.gender?.replace('_', ' ') || '—'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
                {isEditing ? (
                  <select
                    name="maritalStatus"
                    defaultValue={privateInfo?.marital_status || 'single'}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600 bg-white"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-800 capitalize">{privateInfo?.marital_status || 'Single'}</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Bank Details & Statutory Identifiers */}
          <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Bank Details</h4>
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              {isEditing ? (
                <input
                  name="accountNumber"
                  type="text"
                  defaultValue={privateInfo?.account_number || ''}
                  placeholder="e.g. 123456789012"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-mono font-bold text-slate-900">{privateInfo?.account_number || '—'}</p>
              )}
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              {isEditing ? (
                <input
                  name="bankName"
                  type="text"
                  defaultValue={privateInfo?.bank_name || ''}
                  placeholder="e.g. HDFC Bank"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">{privateInfo?.bank_name || '—'}</p>
              )}
            </div>

            {/* IFSC Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              {isEditing ? (
                <input
                  name="ifscCode"
                  type="text"
                  defaultValue={privateInfo?.ifsc_code || ''}
                  placeholder="e.g. HDFC0001234"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono uppercase focus:border-purple-600"
                />
              ) : (
                <p className="text-sm font-mono font-bold text-purple-700">{privateInfo?.ifsc_code || '—'}</p>
              )}
            </div>

            <div className="flex items-center gap-2 border-b border-slate-100 pt-3 pb-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Statutory Tax & PF IDs</h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* PAN Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN No</label>
                {isEditing ? (
                  <input
                    name="panNumber"
                    type="text"
                    defaultValue={privateInfo?.pan_number || ''}
                    placeholder="ABCDE1234F"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono uppercase focus:border-purple-600"
                  />
                ) : (
                  <p className="text-xs font-mono font-bold text-slate-800">{privateInfo?.pan_number || '—'}</p>
                )}
              </div>

              {/* UAN Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UAN NO</label>
                {isEditing ? (
                  <input
                    name="uanNumber"
                    type="text"
                    defaultValue={privateInfo?.uan_number || ''}
                    placeholder="100123456789"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-purple-600"
                  />
                ) : (
                  <p className="text-xs font-mono font-bold text-slate-800">{privateInfo?.uan_number || '—'}</p>
                )}
              </div>

              {/* Emp Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emp Code</label>
                {isEditing ? (
                  <input
                    name="empCode"
                    type="text"
                    defaultValue={privateInfo?.emp_code || ''}
                    placeholder="EMP-01"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 font-mono focus:border-purple-600"
                  />
                ) : (
                  <p className="text-xs font-mono font-bold text-slate-800">{privateInfo?.emp_code || '—'}</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Submit Actions */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save Private Information
            </Button>
          </div>
        )}
      </form>

    </div>
  );
}
