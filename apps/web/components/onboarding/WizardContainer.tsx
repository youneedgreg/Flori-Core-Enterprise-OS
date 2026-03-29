'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      alert(`Error: ${msg}`);
    }
  };

  const handleNextStep1 = async () => {
    setLoading(true);
    try { await post('/onboarding/farm-profile', farmProfile); setStep(1); } 
    catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleNextStep2 = async () => {
    setLoading(true);
    try {
      const parsed = zones.map((z) => ({ ...z, areaSqm: parseFloat(z.areaSqm) || undefined, cropVarieties: z.cropVarieties.split(',').map((c) => c.trim()).filter(Boolean) }));
      const result = await post('/onboarding/zones', parsed) as CreatedZone[];
      setCreatedZones(result);
      setStep(2);
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleNextStep3 = async () => {
    setLoading(true);
    try {
      if (members.length > 0) await post('/onboarding/invite-team', members);
      setStep(3);
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (devices.length > 0) await post('/onboarding/iot-devices', devices);
      router.push('/dashboard');
    } catch (e) { handleError(e); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-3xl font-black tracking-tighter text-white inline-flex items-center gap-1">
            <span className="text-emerald-500">Flori-</span>Core
          </div>
          <p className="text-slate-400 mt-1 text-sm">Let&apos;s set up your workspace</p>
        </div>

        <Stepper currentStep={step} steps={STEPS} />

        <div className="glass p-8 rounded-3xl border border-slate-800">
          {step === 0 && <Step1FarmProfile data={farmProfile} onChange={setFarmProfile} onNext={handleNextStep1} />}
          {step === 1 && <Step2Zones zones={zones} onChange={setZones} onNext={handleNextStep2} onBack={() => setStep(0)} />}
          {step === 2 && <Step3Team members={members} roles={roles} onChange={setMembers} onNext={handleNextStep3} onBack={() => setStep(1)} />}
          {step === 3 && <Step4IoT devices={devices} zones={createdZones} onChange={setDevices} onSubmit={handleSubmit} onBack={() => setStep(2)} loading={loading} />}
        </div>
      </div>
    </div>
  );
}
