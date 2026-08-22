'use client';

import React, { useState } from 'react';
import { EmployeeResume } from '@/types/database.types';
import { updateResumeAction } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';
import { Pencil, Plus, Check, X, Award, Sparkles, BookOpen, Heart, Compass } from 'lucide-react';

interface ResumeTabProps {
  profileId: string;
  resume: EmployeeResume | null;
  canEdit: boolean;
}

export function ResumeTab({ profileId, resume, canEdit }: ResumeTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [about, setAbout] = useState(resume?.about || '');
  const [whatILove, setWhatILove] = useState(resume?.what_i_love_about_job || '');
  const [interests, setInterests] = useState(resume?.interests_and_hobbies || '');
  const [skills, setSkills] = useState<string[]>(resume?.skills || ['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
  const [certifications, setCertifications] = useState<Array<{ title: string; issuer?: string; date?: string; url?: string }>>(
    (resume?.certifications as any) || [
      { title: 'Full-Stack Web Development', issuer: 'Meta', date: '2024' },
      { title: 'PostgreSQL Database Professional', issuer: 'Supabase', date: '2025' },
    ]
  );

  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSaveSection(section: string) {
    setSaving(true);
    await updateResumeAction(profileId, {
      about,
      what_i_love_about_job: whatILove,
      interests_and_hobbies: interests,
      skills,
      certifications,
    });
    setSaving(false);
    setEditingSection(null);
  }

  function handleAddSkill() {
    if (!newSkill.trim()) return;
    const updated = [...skills, newSkill.trim()];
    setSkills(updated);
    setNewSkill('');
    setShowSkillInput(false);
    updateResumeAction(profileId, { about, what_i_love_about_job: whatILove, interests_and_hobbies: interests, skills: updated, certifications });
  }

  function handleRemoveSkill(skillToRemove: string) {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    updateResumeAction(profileId, { about, what_i_love_about_job: whatILove, interests_and_hobbies: interests, skills: updated, certifications });
  }

  function handleAddCert() {
    if (!newCertTitle.trim()) return;
    const updated = [...certifications, { title: newCertTitle.trim(), issuer: newCertIssuer.trim() || 'Verified', date: String(new Date().getFullYear()) }];
    setCertifications(updated);
    setNewCertTitle('');
    setNewCertIssuer('');
    setShowCertInput(false);
    updateResumeAction(profileId, { about, what_i_love_about_job: whatILove, interests_and_hobbies: interests, skills, certifications: updated });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Biographical & Motivation Cards */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Card 1: About */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">About</h3>
            </div>
            {canEdit && editingSection !== 'about' && (
              <button
                onClick={() => setEditingSection('about')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                title="Edit About"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {editingSection === 'about' ? (
            <div className="space-y-3">
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell your professional story, background, and career highlights..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                  <X className="h-3 w-3" /> Cancel
                </Button>
                <Button size="sm" variant="primary" isLoading={saving} onClick={() => handleSaveSection('about')}>
                  <Check className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {about || <span className="text-slate-400 italic">No biography added yet. Click the pencil icon to introduce yourself.</span>}
            </p>
          )}
        </div>

        {/* Card 2: What I love about my job */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">What I love about my job</h3>
            </div>
            {canEdit && editingSection !== 'what_i_love' && (
              <button
                onClick={() => setEditingSection('what_i_love')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                title="Edit Motivation"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {editingSection === 'what_i_love' ? (
            <div className="space-y-3">
              <textarea
                value={whatILove}
                onChange={(e) => setWhatILove(e.target.value)}
                placeholder="What excites you every morning? Team culture, technical challenges, making an impact..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                  <X className="h-3 w-3" /> Cancel
                </Button>
                <Button size="sm" variant="primary" isLoading={saving} onClick={() => handleSaveSection('what_i_love')}>
                  <Check className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {whatILove || <span className="text-slate-400 italic">Share what drives your passion and what you love most about your role.</span>}
            </p>
          )}
        </div>

        {/* Card 3: My interests and hobbies */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">My interests and hobbies</h3>
            </div>
            {canEdit && editingSection !== 'interests' && (
              <button
                onClick={() => setEditingSection('interests')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                title="Edit Interests"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {editingSection === 'interests' ? (
            <div className="space-y-3">
              <textarea
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Photography, chess, weekend trekking, open source contributing..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                  <X className="h-3 w-3" /> Cancel
                </Button>
                <Button size="sm" variant="primary" isLoading={saving} onClick={() => handleSaveSection('interests')}>
                  <Check className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {interests || <span className="text-slate-400 italic">Tell teammates what you enjoy outside of work.</span>}
            </p>
          )}
        </div>

      </div>

      {/* Right Column: Skills & Certifications */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 4: Skills */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Skills</h3>
            </div>
            {canEdit && !showSkillInput && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSkillInput(true)}
                className="text-xs py-1"
              >
                <Plus className="h-3 w-3" /> Add Skills
              </Button>
            )}
          </div>

          {showSkillInput && (
            <div className="mb-4 flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="e.g. Next.js"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                autoFocus
              />
              <Button size="sm" variant="primary" onClick={handleAddSkill}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSkillInput(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800"
              >
                {skill}
                {canEdit && (
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-purple-400 hover:text-purple-900 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Card 5: Certifications */}
        <div className="clean-card rounded-2xl p-6 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Certifications</h3>
            </div>
            {canEdit && !showCertInput && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCertInput(true)}
                className="text-xs py-1"
              >
                <Plus className="h-3 w-3" /> Add Certification
              </Button>
            )}
          </div>

          {showCertInput && (
            <div className="mb-4 space-y-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
              <input
                type="text"
                value={newCertTitle}
                onChange={(e) => setNewCertTitle(e.target.value)}
                placeholder="Certification Title"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600"
                autoFocus
              />
              <input
                type="text"
                value={newCertIssuer}
                onChange={(e) => setNewCertIssuer(e.target.value)}
                placeholder="Issuing Organization (e.g. AWS, Meta)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-purple-600"
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setShowCertInput(false)}>Cancel</Button>
                <Button size="sm" variant="primary" onClick={handleAddCert}>Save</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {certifications.map((cert, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{cert.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cert.issuer || 'Verified Institution'} &bull; {cert.date || 'Recent'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
