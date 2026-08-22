'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { NewEmployeeModal } from '@/components/employees/NewEmployeeModal';
import { getEmployeesAction, EmployeeWithLiveStatus } from '@/app/actions/employees';
import { Profile } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Settings, Users, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithLiveStatus[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    const res = await getEmployeesAction();
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to load employees.');
    } else {
      setEmployees(res.employees);
      setCurrentProfile(res.currentUserProfile);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees based on search input
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const loginId = (emp.login_id || '').toLowerCase();
    const position = (emp.job_position || '').toLowerCase();
    const dept = (emp.department?.name || '').toLowerCase();
    return fullName.includes(q) || loginId.includes(q) || position.includes(q) || dept.includes(q);
  });

  const isAdminOrHr = currentProfile?.role === 'admin' || currentProfile?.role === 'hr_officer';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Top Persistent Navbar */}
        <Navbar initialProfile={currentProfile} />

        {/* Main Content Container */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Subheader & Controls Bar (Wireframe two.png) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            
            {/* Left: NEW Button (Admin/HR Only) */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {isAdminOrHr && (
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  className="font-bold tracking-wider uppercase px-5 py-2 shadow-sm shadow-purple-600/30"
                >
                  <Plus className="h-4 w-4" />
                  NEW
                </Button>
              )}

              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Users className="h-4 w-4 text-purple-600" />
                <span>{filteredEmployees.length} Employees</span>
              </div>
            </div>

            {/* Right: Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, ID, role..."
                className="w-full rounded-full border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 shadow-2xs font-medium"
              />
            </div>

          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <Button size="sm" variant="outline" onClick={loadEmployees}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 rounded-xl border border-slate-200 bg-white p-5 animate-pulse flex gap-4">
                  <div className="h-14 w-14 rounded-lg bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No employees found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                {searchQuery ? `No matches found for "${searchQuery}". Try a different keyword.` : 'Get started by adding your first employee to the organization.'}
              </p>
              {isAdminOrHr && !searchQuery && (
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Add First Employee
                </Button>
              )}
            </div>
          ) : (
            /* 3x3 Card Grid (Wireframe two.png) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((emp) => (
                <EmployeeCard key={emp.id} employee={emp} />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Footer with Settings Link (Wireframe two.png bottom-left annotation) */}
      <footer className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-purple-600 transition-colors cursor-pointer">
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </div>
        <p>Dayflow HRMS &copy; 2026</p>
      </footer>

      {/* Provision Employee Modal */}
      <NewEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadEmployees();
        }}
      />
    </div>
  );
}
