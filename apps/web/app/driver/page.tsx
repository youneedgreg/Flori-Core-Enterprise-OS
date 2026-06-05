'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Package, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { decodeJWT, logout, isTokenExpired } from '../../lib/auth';
import ProofOfDeliveryModal from '../../components/logistics/ProofOfDeliveryModal';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Customer {
  name: string;
  address?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
}

interface Stop {
  id: string;
  sequenceIndex: number;
  status: string;
  order: Order;
}

interface Route {
  id: string;
  date: string;
  status: string;
  deliveryStops: Stop[];
}

export default function DriverDashboardPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStop, setActiveStop] = useState<Stop | null>(null);

  const getAuthHeader = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchDriverData = async () => {
    // In a real scenario, this gets driver's specific routes using ID decoded from JWT
    // Currently, our Backend returns all. So we filter or accept all. By default the API was 
    // structured to pass `?driverId=X`, but we don't extract the decoded JWT cleanly yet here.
    // For MVP demonstration, we fetch and show active routes.
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const res = await fetch(`${API}/logistics/routes`, { headers });
      if (!res.ok) throw new Error();
      const allRoutes = await res.json();
      
      // Select the first active route for today
      // In production, we'd strictly match `route.driverId === myDecodedId`
      setRoutes(allRoutes);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleDeliveryComplete = () => {
    setActiveStop(null);
    fetchDriverData();
  };

  // Find the active route
  const activeRoute = routes.find(r => r.status === 'IN_PROGRESS' || r.status === 'PENDING');

  if (loading) {
    return (
      <div className="flex flex-col items-center pt-20">
         <Navigation className="w-10 h-10 text-emerald-500/50 animate-bounce" />
         <p className="font-black text-slate-500 uppercase tracking-widest mt-4">Connecting to Fleet...</p>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="flex flex-col items-center pt-20 bg-white/5 rounded-3xl p-10 border border-white/5 text-center shadow-max">
        <Clock className="w-16 h-16 text-slate-600 mb-6" />
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">No Active Dispatches</h2>
        <p className="text-slate-500 text-sm mt-3">You do not have any routes assigned for today. Sit tight until dispatch signals you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[2rem] flex items-center justify-between shadow-xl shadow-emerald-500/5">
         <div>
           <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Active Route Status</p>
           <h2 className="text-2xl text-white font-black uppercase italic tracking-tight">{activeRoute.date.split('T')[0]} Run</h2>
         </div>
         <span className="px-4 py-2 bg-emerald-500 text-brand-dark font-black tracking-widest uppercase text-xs rounded-xl shadow-md">
           {activeRoute.status}
         </span>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[31px] before:w-1 before:bg-white/5 before:top-4 before:bottom-4">
         {activeRoute.deliveryStops.map((stop, i) => (
           <div key={stop.id} className="relative z-10 flex gap-4">
             {/* Timeline Node */}
             <div className="shrink-0 flex flex-col items-center mt-1">
               <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black transition-all ${
                 stop.status === 'DELIVERED' ? 'bg-emerald-500 border-emerald-400 text-brand-dark' : 
                 i === 0 || activeRoute.deliveryStops[i-1]?.status === 'DELIVERED' ? 'bg-amber-500 border-amber-400 text-brand-dark animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 
                 'bg-brand-dark border-white/20 text-slate-500'
               }`}>
                 {stop.status === 'DELIVERED' ? <CheckCircle className="w-6 h-6" /> : i + 1}
               </div>
             </div>

             {/* Stop Card */}
             <div className={`flex-1 p-5 rounded-3xl border transition-all ${
                 stop.status === 'DELIVERED' ? 'bg-emerald-500/5 border-emerald-500/20' : 
                 i === 0 || activeRoute.deliveryStops[i-1]?.status === 'DELIVERED' ? 'bg-white/5 border-amber-500/30' : 
                 'bg-black/20 border-white/5 opacity-60'
             }`}>
               <div className="flex items-start justify-between">
                 <div>
                   <h3 className="text-sm font-black text-white">{stop.order.customer.name}</h3>
                   <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                     <MapPin className="w-3 h-3 text-slate-500" /> {stop.order.customer.address || 'No Address Logged'}
                   </p>
                 </div>
                 <div className="px-2 py-1 bg-white/5 rounded pl-1.5 flex items-center gap-1">
                   <Package className="w-3 h-3 text-slate-500" />
                   <span className="text-[9px] font-black uppercase text-slate-400">Order #{stop.order.id.slice(0, 6)}</span>
                 </div>
               </div>

               {stop.status !== 'DELIVERED' && (i === 0 || activeRoute.deliveryStops[i-1]?.status === 'DELIVERED') && (
                 <button 
                   onClick={() => setActiveStop(stop)}
                   className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 text-brand-dark font-black tracking-widest uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                 >
                   <MapPin className="w-4 h-4" /> Arrive & Complete Stop
                 </button>
               )}
             </div>
           </div>
         ))}
      </div>

      {activeStop && (
        <ProofOfDeliveryModal 
           stopId={activeStop.id} 
           orderId={activeStop.order.id} 
           onClose={() => setActiveStop(null)} 
           onSuccess={handleDeliveryComplete} 
        />
      )}
    </div>
  );
}
