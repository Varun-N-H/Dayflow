'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Upload, AlertCircle } from 'lucide-react';
import { TimeOffType } from '@/types/database.types';

interface TimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  employeeName: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function TimeOffModal({
  isOpen,
  onClose,
  onSubmit,
  employeeName,
  defaultStartDate,
  defaultEndDate,
}: TimeOffModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [timeOffType, setTimeOffType] = useState<TimeOffType>('paid_time_off');
  const [startDate, setStartDate] = useState(defaultStartDate || todayStr);
  const [endDate, setEndDate] = useState(defaultEndDate || todayStr);
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate allocation days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const allocationDays = isNaN(diffDays) ? 1 : diffDays;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('timeOffType', timeOffType);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('allocationDays', String(allocationDays));
    formData.append('remarks', remarks);
    if (file) {
      formData.append('attachmentFile', file);
    }

    const res = await onSubmit(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to submit time off request.');
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Modal Header (Wireframe 6) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Time off Type Request</h2>
              <p className="text-xs text-slate-500">Apply for annual, medical, or unpaid time off</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Employee Name (Read Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Employee</label>
            <input
              type="text"
              readOnly
              value={employeeName}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
            />
          </div>

          {/* Time Off Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time off Type *</label>
            <select
              value={timeOffType}
              onChange={(e) => setTimeOffType(e.target.value as TimeOffType)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-purple-600 focus:outline-none"
            >
              <option value="paid_time_off">Paid time off (Vacation)</option>
              <option value="sick_leave">Sick Leave (Medical)</option>
              <option value="unpaid_leaves">Unpaid Leaves (Loss of Pay)</option>
            </select>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Allocation Preview */}
          <div className="flex items-center justify-between rounded-xl bg-purple-50/60 border border-purple-100 p-3 text-xs">
            <span className="font-semibold text-purple-900">Allocation:</span>
            <span className="font-mono font-bold text-purple-700">
              {String(allocationDays).padStart(2, '0')}.00 Days
            </span>
          </div>

          {/* Attachment for Sick Leave Certificate */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attachment: <span className="text-slate-400 font-normal">(For sick leave certificate)</span>
            </label>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <Upload className="h-4 w-4 text-purple-600" />
                <span className="truncate">{file ? file.name : 'Upload Medical Note / PDF'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 text-slate-400 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Reason</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes for reviewer..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-purple-600"
            />
          </div>

          {/* Action Footer (Submit / Discard) */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose}>
              Discard
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Submit Request
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
