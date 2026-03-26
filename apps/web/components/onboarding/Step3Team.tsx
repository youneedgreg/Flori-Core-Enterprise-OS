'use client';

import React from 'react';

interface Member { email: string; roleId: string }
interface Role { id: string; name: string }
interface Props {
  members: Member[];
  roles: Role[];
  onChange: (members: Member[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Team({ members, roles, onChange, onNext, onBack }: Props) {
  const addMember = () => onChange([...members, { email: '', roleId: roles[0]?.id ?? '' }]);
  const removeMember = (i: number) => onChange(members.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: keyof Member, value: string) => {
    const updated = [...members];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-white">Invite Team Members</h2>
      <p className="text-slate-400 mb-8">Add your team and assign roles. They'll receive login credentials via email.</p>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="email"
              required
              placeholder="Email address *"
              value={member.email}
              onChange={(e) => updateMember(i, 'email', e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500"
            />
            <select
              value={member.roleId}
              onChange={(e) => updateMember(i, 'roleId', e.target.value)}
              className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name.replace('_', ' ')}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeMember(i)}
              className="text-slate-500 hover:text-red-400 transition-colors text-xl leading-none shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">No members yet — you can also skip this step.</p>
      )}

      <button
        type="button"
        onClick={addMember}
        className="mt-4 w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-all text-sm font-medium"
      >
        + Invite Another Member
      </button>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all"
        >
          {members.length > 0 ? 'Send Invites →' : 'Skip →'}
        </button>
      </div>
    </div>
  );
}
