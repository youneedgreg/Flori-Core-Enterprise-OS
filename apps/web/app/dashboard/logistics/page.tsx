'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Navigation, User, Check, PlayCircle, Globe, BadgeDollarSign, Calendar} from 'lucide-react';
import { toast } from 'sonner';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { logout, isTokenExpired } from '../../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customer: { name: string, country?: string };
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
}

interface Route {
  id: string;
  date: string;
  status: string;
  vehicle: Vehicle;
  driver: { email: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deliveryStops: any[];
}

export default function LogisticsDispatcherPage() {
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'ORDERS'>('DISPATCH');

  // Unified State
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch Builder State
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const [viewState, setViewState] = useState({
    longitude: 37.0,
    latitude: -1.0,
    zoom: 6
  });

  const getAuthHeader = () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const headers = getAuthHeader();
    if (!headers) return;

    try {
      const resOrders = await fetch(`${API}/logistics/orders`, { headers });
      const resVehicles = await fetch(`${API}/logistics/vehicles`, { headers });
      const resRoutes = await fetch(`${API}/logistics/routes`, { headers });

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resVehicles.ok) setVehicles(await resVehicles.json());
      if (resRoutes.ok) setRoutes(await resRoutes.json());
    } catch {
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const handleCreateRoute = async () => {
    if (!selectedDriver) return toast.error('Enter driver ID / email');
    if (!selectedVehicle) return toast.error('Select a vehicle');
    if (selectedOrders.length === 0) return toast.error('Select at least 1 order');

    const headers = getAuthHeader();
    if (!headers) return;

    const payload = {
      driverId: selectedDriver,
      vehicleId: selectedVehicle,
      date: new Date().toISOString(),
      stopOrderIds: selectedOrders
    };

    try {
      const res = await fetch(`${API}/logistics/routes`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      toast.success('Route Dispatched Successfully!');
      setSelectedOrders([]);
      setSelectedDriver('');
      setSelectedVehicle('');
      loadData();
    } catch {
      toast.error('Failed to dispatch route');
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    PACKING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    SHIPPED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    DISPATCHED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            Fleet & Dispatch <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] rounded-lg rotate-3 uppercase font-black tracking-widest border border-emerald-500/20">LIVE</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
            Global routing & last-mile telemetry
          </p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('DISPATCH')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'DISPATCH' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
          >
            Live Monitor
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${activeTab === 'ORDERS' ? 'bg-white/10 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
          >
            Order Manifests
          </button>
        </div>
      </div>

      {activeTab === 'DISPATCH' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 pb-8">
          <div className="md:col-span-4 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-brand-dark/50 shrink-0">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-500" /> Route Builder
              </h3>
            </div>
            
            <div className="p-6 space-y-4 border-b border-white/5 flex-shrink-0">
              <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Driver Assignment (ID)</label>
                 <input 
                    type="text" 
                    value={selectedDriver}
                    onChange={e => setSelectedDriver(e.target.value)}
                    placeholder="Enter assigned driver UUID..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-emerald-500"
                 />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Assigned Vehicle</label>
                 <select 
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-emerald-500"
                 >
                   <option value="" className="bg-brand-dark">Select a vehicle...</option>
                   {vehicles.map(v => (
                     <option key={v.id} value={v.id} className="bg-brand-dark">{v.plateNumber} ({v.type})</option>
                   ))}
                 </select>
              </div>
              <button 
                onClick={handleCreateRoute}
                disabled={selectedOrders.length === 0 || !selectedVehicle}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-brand-dark font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" /> Dispatch Route ({selectedOrders.length} Stops)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Unassigned Shipments</h4>
              {orders.filter(o => o.status === 'CONFIRMED' || o.status === 'IN_PICKING').length === 0 && !loading && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">No pending orders.</p>
              )}
              {orders.filter(o => o.status === 'CONFIRMED' || o.status === 'IN_PICKING').map(order => (
                <div 
                  key={order.id}
                  onClick={() => toggleOrderSelection(order.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedOrders.includes(order.id) 
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-black/20 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedOrders.includes(order.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                    }`}>
                      {selectedOrders.includes(order.id) && <Check className="w-3 h-3 text-brand-dark" />}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    <p className="flex items-center gap-2"><User className="w-3 h-3 text-slate-500" /> {order.customer.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col gap-6 h-[80vh] md:h-auto pb-6">
            <div className="flex-1 bg-white/5 rounded-[2rem] border border-white/5 overflow-hidden relative min-h-[300px]">
              {!MAPBOX_TOKEN ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark/90 backdrop-blur-sm z-10 p-10 text-center">
                  <MapPin className="w-16 h-16 text-emerald-500/20 mb-4" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Map Engine Offline</h3>
                  <p className="text-sm text-slate-400 max-w-md leading-relaxed">Map telemetry is disabled because <code className="bg-black/50 px-2 py-1 rounded text-emerald-500 mx-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> is not present in your environment variables.</p>
                </div>
              ) : (
                <Map
                  {...viewState}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onMove={(evt: any) => setViewState(evt.viewState)}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  style={{width: '100%', height: '100%'}}
                >
                  <NavigationControl position="bottom-right" />
                </Map>
              )}
            </div>

            <div className="h-48 md:h-64 bg-white/5 rounded-[2rem] border border-white/5 p-6 flex flex-col shrink-0">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4 shrink-0">
                 <Truck className="w-4 h-4 text-emerald-500" /> Active Fleet Routes
               </h3>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                 {routes.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">No active dispatch routes online.</p>
                   </div>
                 ) : (
                   routes.map(r => (
                     <div key={r.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                       <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-lg ${r.status==='COMPLETED'?'bg-emerald-500/10':'bg-emerald-500/20'}`}>
                           <Truck className={`w-5 h-5 ${r.status==='COMPLETED'?'text-emerald-500/50':'text-emerald-500'}`} />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white tracking-wide">{r.vehicle.plateNumber}</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                             Driver: <span className="text-slate-300">{r.driver.email}</span> • {r.deliveryStops?.length} Stops
                           </p>
                         </div>
                       </div>
                       <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                         r.status === 'COMPLETED' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500/50' : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 animate-pulse'
                       }`}>
                         {r.status}
                       </span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative pb-24">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Order Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/2 transition-colors group cursor-default">
                    <td className="px-8 py-6">
                      <p className="text-xs font-black text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">#{order.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        Created {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        order.type === 'EXPORT' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {order.type === 'EXPORT' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {order.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-white tracking-tight">{order.customer.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{order.customer.country || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <BadgeDollarSign className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-white">{order.currency} {order.totalAmount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${STATUS_COLORS[order.status] || 'bg-slate-500/10 opacity-50'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
