import React from 'react';
import { Mail, Shield, Trash2, Plus, ArrowLeft, ArrowRight, UserPlus, ChevronDown } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Personnel Integration</h2>
        <p className="text-slate-500 font-medium">Authorize team members and assign administrative clearance levels.</p>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {members.map((member, i) => (
          <div key={i} className="flex items-center gap-3 group animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="relative flex-1 group/input">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors" />
              <input
                type="email"
                required
                placeholder="Operator Email Address *"
                value={member.email}
                onChange={(e) => updateMember(i, 'email', e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold placeholder:text-slate-700 transition-all"
              />
            </div>
            
            <div className="relative group/input w-48">
              <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within/input:text-brand-green transition-colors z-10" />
              <select
                value={member.roleId}
                onChange={(e) => updateMember(i, 'roleId', e.target.value)}
                className="w-full pl-14 pr-10 py-4 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-brand-green/20 outline-none text-white font-bold appearance-none cursor-pointer transition-all"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id} className="bg-brand-dark">{role.name.replace('_', ' ')}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => removeMember(i)}
              className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {members.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02]">
            <UserPlus className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No Operators Assigned</p>
            <p className="text-slate-600 text-xs mt-1">You can skip this and add team members later.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-slate-500 hover:border-brand-green/30 hover:text-brand-green hover:bg-brand-green/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Authorize New Personnel
      </button>

      <div className="flex gap-4 pt-4">
        <button 
          onClick={onBack} 
          className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black tracking-tight transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Abort
        </button>
        <button
          onClick={onNext}
          className="flex-[2] py-5 rounded-2xl bg-brand-green text-brand-dark font-black tracking-tight hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          {members.length > 0 ? (
            <>
              Deploy Access Protocols
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Proceed Solo
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
