'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database.types';
import { 
  Users, 
  Clock, 
  Calendar, 
  User, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Building2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  initialProfile?: Profile | null;
}

export default function Navbar({ initialProfile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch current user and today's attendance status
  useEffect(() => {
    async function loadUserAndAttendance() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*, company:companies(*)')
          .eq('id', user.id)
          .single();

        if (prof) setProfile(prof as Profile);

        // Fetch today's attendance record
        const today = new Date().toISOString().split('T')[0];
        const { data: att } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('profile_id', user.id)
          .eq('date', today)
          .single();

        if (att && att.check_in && !att.check_out) {
          setIsCheckedIn(true);
        } else {
          setIsCheckedIn(false);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      }
    }

    loadUserAndAttendance();
  }, [supabase]);

  // Handle Punch In / Punch Out
  async function handleToggleAttendance() {
    setLoadingAction(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      if (!isCheckedIn) {
        // Punch In
        const { error } = await supabase
          .from('attendance_records')
          .upsert({
            company_id: profile.company_id,
            profile_id: user.id,
            date: today,
            check_in: now,
            status: 'present',
          }, { onConflict: 'profile_id,date' });

        if (!error) {
          setIsCheckedIn(true);
        }
      } else {
        // Punch Out
        const { error } = await supabase
          .from('attendance_records')
          .update({
            check_out: now,
          })
          .eq('profile_id', user.id)
          .eq('date', today);

        if (!error) {
          setIsCheckedIn(false);
        }
      }
      router.refresh();
    } catch (err) {
      console.error('Attendance action failed:', err);
    } finally {
      setLoadingAction(false);
    }
  }

  // Handle Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/signin');
    router.refresh();
  }

  const navTabs = [
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Time Off', href: '/time-off', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo & Navigation Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/employees" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            {profile?.company?.logo_url ? (
              <img 
                src={profile.company.logo_url} 
                alt={profile.company.name} 
                className="h-8 w-auto max-w-[120px] rounded object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 font-bold text-white shadow-md shadow-purple-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                {profile?.company?.name || 'Dayflow'}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">HRMS</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-800 text-purple-400 shadow-inner'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Systray Controls & User Avatar */}
        <div className="flex items-center gap-4">
          
          {/* Live Status Dot & Quick Check-In / Check-Out Systray */}
          <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/60 py-1 pl-3 pr-1.5">
            {/* Status Dot */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                {isCheckedIn ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                )}
              </span>
              <span className="text-xs font-medium text-zinc-300 hidden sm:inline">
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleToggleAttendance}
              disabled={loadingAction}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
                isCheckedIn
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 hover:brightness-110'
              }`}
            >
              {isCheckedIn ? (
                <>Check Out &rarr;</>
              ) : (
                <>Check IN &rarr;</>
              )}
            </button>
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center rounded-full ring-2 ring-purple-500/30 hover:ring-purple-500 transition-all focus:outline-none"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.first_name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-900/60 font-semibold text-purple-200 text-xs border border-purple-500/40">
                  {profile ? `${profile.first_name[0]}${profile.last_name[0]}` : 'U'}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900/95 py-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <div className="border-b border-zinc-800/80 px-4 py-2.5">
                  <p className="text-sm font-semibold text-white truncate">
                    {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {profile?.login_id || profile?.email || 'employee'}
                  </p>
                  <span className="mt-1 inline-block rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300 uppercase tracking-wider">
                    {profile?.role || 'employee'}
                  </span>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4 text-purple-400" />
                  My Profile
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
