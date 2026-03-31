'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Stepper from './Stepper';
import Step1FarmProfile from './Step1FarmProfile';
import Step2Zones from './Step2Zones';
import Step3Team from './Step3Team';
import Step4IoT from './Step4IoT';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const STEPS = ['Farm Profile', 'Zones', 'Team', 'IoT Devices'];

interface Zone { name: string; areaSqm: string; cropVarieties: string }
interface Member { email: string; roleId: string }
interface Device { type: string; macAddress: string; mqttTopic: string; zoneId: string }
interface Role { id: string; name: string }
interface CreatedZone { id: string; name: string }

export default function WizardContainer({ token }: { token: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [createdZones, setCreatedZones] = useState<CreatedZone[]>([]);

  const [farmProfile, setFarmProfile] = useState({
    name: '', location: '', gpsCoordinates: '', certifications: [] as string[], contactEmail: '', contactPhone: '', logoUrl: '',
  });
  const [zones, setZones] = useState<Zone[]>([{ name: '', areaSqm: '', cropVarieties: '' }]);
  const [members, setMembers] = useState<Member[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const headers = React.useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token]);

  // Fetch roles for the team invite dropdown
  useEffect(() => {
    fetch(`${API}/auth/roles`, { headers })
      .then(async (r) => {
        if (r.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }
        if (!r.ok) throw new Error('Failed to fetch roles');
        return r.json();
      })
      .then((data: Role[]) => setRoles(data))
      .catch((err) => console.error(err));
  }, [headers, router]);

  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/';
        router.push('/login');
        throw new Error('Session expired');
      }
      let errText = await res.text();
      try {
        const json = JSON.parse(errText);
        errText = json.message || errText;
      } catch { /* ignore */ }
      throw new Error(errText);
    }
    return res.json();
  };

  const handleError = (e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg !== 'Session expired' && msg !== 'Unauthorized') {
      toast.error(msg);
    }
  };

  const handleNextStep1 = async () => {
    setLoading(true);
    try { 
      await post('/onboarding/farm-profile', farmProfile); 
      toast.success('Farm profile saved!');
      setStep(1); 
    } 
    catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleNextStep2 = async () => {
    setLoading(true);
    try {
      const parsed = zones.map((z) => ({ ...z, areaSqm: parseFloat(z.areaSqm) || undefined, cropVarieties: z.cropVarieties.split(',').map((c) => c.trim()).filter(Boolean) }));
      const result = await post('/onboarding/zones', parsed) as CreatedZone[];
      setCreatedZones(result);
      toast.success('Zones configured successfully!');
      setStep(2);
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleNextStep3 = async () => {
    setLoading(true);
    try {
      if (members.length > 0) {
        await post('/onboarding/invite-team', members);
        toast.success(`Sent ${members.length} team invite(s)!`);
      }
      setStep(3);
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (devices.length > 0) await post('/onboarding/iot-devices', devices);
      toast.success('Onboarding complete! Welcome to Flori-Core OS.');
      router.push('/dashboard');
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-green rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <div className="w-6 h-6 border-4 border-brand-dark rounded-sm rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter text-white leading-none">Flori-Core</span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-green mt-1">Enterprise OS</span>
            </div>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initialize Digital Infrastructure</p>
        </div>

        <Stepper currentStep={step} steps={STEPS} />

        <div className="bg-brand-dark/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="relative z-10">
            {step === 0 && <Step1FarmProfile data={farmProfile} onChange={setFarmProfile} onNext={handleNextStep1} />}
            {step === 1 && <Step2Zones zones={zones} onChange={setZones} onNext={handleNextStep2} onBack={() => setStep(0)} />}
            {step === 2 && <Step3Team members={members} roles={roles} onChange={setMembers} onNext={handleNextStep3} onBack={() => setStep(1)} />}
            {step === 3 && <Step4IoT devices={devices} zones={createdZones} onChange={setDevices} onSubmit={handleSubmit} onBack={() => setStep(2)} loading={loading} />}
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Readiness: Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
