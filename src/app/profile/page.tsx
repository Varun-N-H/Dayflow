'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { getProfileDataAction, FullProfileData, updateProfileHeaderAction, uploadAvatarAction } from '@/app/actions/profile';
import { ResumeTab } from '@/components/profile/ResumeTab';
import { PrivateInfoTab } from '@/components/profile/PrivateInfoTab';
import { SalaryTab } from '@/components/profile/SalaryTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { Button } from '@/components/ui/Button';
import { 
  User, 
  FileText, 
  Shield, 
  IndianRupee, 
  Lock, 
  Pencil, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';

import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id') || undefined;
  const initialTab = searchParams.get('tab') || 'resume';
  const forceReset = searchParams.get('reset') === 'true';

  const [data, setData] = useState<FullProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<string>(forceReset ? 'security' : initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    const res = await getProfileDataAction(targetId);
    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to load profile.');
    } else {
      setData(res.data);
    }
  }

  useEffect(() => {
    loadData();
  }, [targetId]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatarFile', file);

    const res = await uploadAvatarAction(data.profile.id, formData);
    setUploadingAvatar(false);

    if (res.success && res.avatarUrl) {
      setData({
        ...data,
        profile: { ...data.profile, avatar_url: res.avatarUrl },
      });
    }
  }

  async function handleHeaderSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;

    const formData = new FormData(e.currentTarget);
    const res = await updateProfileHeaderAction(data.profile.id, formData);

    if (res.success) {
      setIsEditingHeader(false);
      loadData();
    }
  }

  const profile = data?.profile;
  const canEdit = !!(data?.isCurrentUser || data?.isAdmin);

  const tabs = [
    { id: 'resume', label: 'Resume', icon: FileText, visible: true },
    { id: 'private_info', label: 'Private Info', icon: Shield, visible: canEdit },
    { id: 'salary_info', label: 'Salary Info', icon: IndianRupee, visible: data?.isAdmin },
    { id: 'security', label: 'Security', icon: Lock, visible: canEdit },
  ].filter((t) => t.visible);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <Navbar initialProfile={data?.profile} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          
          {loading ? (
            <div className="space-y-6">
              <div className="h-64 rounded-2xl border border-slate-200 bg-white p-8 animate-pulse" />
              <div className="h-96 rounded-2xl border border-slate-200 bg-white p-8 animate-pulse" />
            </div>
          ) : error || !profile ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <h3 className="font-bold">Error Loading Profile</h3>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* Profile Header Card (Wireframes 3 & 4) */}
              <div className="clean-card rounded-2xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xs mb-8 relative">
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  
                  {/* Left: Avatar + Core Info */}
                  <div className="flex items-center gap-6">
                    
                    {/* Avatar Container with Upload Pencil */}
                    <div className="relative group">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.first_name}
                          className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-purple-100 font-bold text-2xl text-purple-700 border-2 border-purple-200">
                          {profile.first_name[0]}{profile.last_name[0]}
                        </div>
                      )}

                      {canEdit && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            title="Upload New Photo"
                            className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-700 transition-all cursor-pointer"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Name, Designation & Login ID */}
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">
                          {profile.first_name} {profile.last_name}
                        </h1>
                        <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 uppercase tracking-wider">
                          {profile.role}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-purple-600 mt-1">
                        {profile.job_position || 'Staff Member'}
                      </p>

                      <p className="font-mono text-xs text-slate-500 font-medium mt-1">
                        Login ID: <span className="text-slate-900 font-bold">{profile.login_id}</span>
                      </p>
                    </div>

                  </div>

                  {/* Header Edit Button */}
                  {canEdit && !isEditingHeader && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingHeader(true)}
                      className="self-start md:self-auto"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Profile Header
                    </Button>
                  )}

                </div>

                {/* Header Edit Drawer Form */}
                {isEditingHeader ? (
                  <form onSubmit={handleHeaderSave} className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                        <input
                          name="firstName"
                          defaultValue={profile.first_name}
                          required
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                        <input
                          name="lastName"
                          defaultValue={profile.last_name}
                          required
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position</label>
                        <input
                          name="jobPosition"
                          defaultValue={profile.job_position || ''}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                        <input
                          name="phone"
                          defaultValue={profile.phone || ''}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                        <input
                          name="workLocation"
                          defaultValue={profile.work_location || ''}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Manager</label>
                        <input
                          name="managerName"
                          defaultValue={profile.manager ? `${profile.manager.first_name} ${profile.manager.last_name}` : ''}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingHeader(false)}>Cancel</Button>
                      <Button size="sm" variant="primary" type="submit">Save Header</Button>
                    </div>
                  </form>
                ) : (
                  /* Two-Column Information Grid (Wireframe 3 & 4) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 text-xs text-slate-600">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Email</span>
                      <p className="font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {profile.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Mobile</span>
                      <p className="font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {profile.phone || '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Department</span>
                      <p className="font-medium text-slate-900 truncate flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {profile.department?.name || 'General'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Manager</span>
                      <p className="font-medium text-slate-900 truncate">
                        {profile.manager ? `${profile.manager.first_name} ${profile.manager.last_name}` : 'Direct Report'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Role-Based Profile Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Surface */}
              <div>
                {activeTab === 'resume' && (
                  <ResumeTab
                    profileId={profile.id}
                    resume={data.resume}
                    canEdit={canEdit}
                  />
                )}

                {activeTab === 'private_info' && (
                  <PrivateInfoTab
                    profileId={profile.id}
                    privateInfo={data.privateInfo}
                    canEdit={canEdit}
                  />
                )}

                {activeTab === 'salary_info' && (
                  <SalaryTab
                    profileId={profile.id}
                    salaryStructure={data.salaryStructure}
                    isAdmin={data.isAdmin}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityTab
                    isTemporaryPassword={profile.is_temporary_password}
                  />
                )}
              </div>
            </>
          )}

        </main>
      </div>

      <footer className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 text-center">
        Dayflow HRMS &copy; 2026. Profile & Statutory Management.
      </footer>
    </div>
  );
}
