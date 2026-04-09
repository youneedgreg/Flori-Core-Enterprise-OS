/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, X, CheckCircle, UploadCloud, ThermometerSnowflake, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logout, isTokenExpired } from '../../lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Props {
  stopId: string;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProofOfDeliveryModal({ stopId, orderId, onClose, onSuccess }: Props) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [tempAtDelivery, setTempAtDelivery] = useState('');
  const [loading, setLoading] = useState(false);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return toast.error('A signature is required for Proof of Delivery.');
    }

    setLoading(true);

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];
      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Convert Signature Canvas to Blob correctly
      const base64Canvas = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const sigRes = await fetch(base64Canvas);
      const sigBlob = await sigRes.blob();

      const formData = new FormData();
      formData.append('signature', sigBlob, 'signature.png');
      
      if (photo) {
        formData.append('photo', photo, photo.name);
      }
      
      if (tempAtDelivery) {
        formData.append('tempAtDelivery', tempAtDelivery);
      }

      const res = await fetch(`${API}/logistics/stops/${stopId}/pod`, {
        method: 'POST',
        headers, // Do NOT send 'Content-Type' with FormData fetch
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit Proof of Delivery');
      }

      toast.success('Stop Completed! Order flagged as Delivered and Invoiced.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end p-4 md:items-center md:justify-center bg-brand-dark/95 backdrop-blur-3xl animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-brand-dark">
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter loading-none">Proof of Delivery</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Ref: Order #{orderId.slice(0, 6)}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 relative">
          
          {/* Sign on Glass */}
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sign on Glass <span className="text-rose-500">*</span></label>
               <button onClick={clearSignature} className="text-[10px] font-bold text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-colors">Clear</button>
             </div>
             <div className="bg-white rounded-2xl overflow-hidden border border-white/20 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]">
               <SignatureCanvas 
                 ref={sigCanvas} 
                 penColor="black"
                 canvasProps={{className: "signature-canvas w-full h-[200px]"}} 
               />
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 font-serif text-3xl font-black select-none">SIGN HERE</div>
             </div>
          </div>

          {/* Photo Capture */}
          <div className="space-y-3">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Delivery Photo Evidence</label>
             <div className="relative">
               <input 
                 type="file" 
                 accept="image/*" 
                 capture="environment" // Suggests back-camera on mobile
                 onChange={handlePhotoCapture}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className={`p-6 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
                 photo ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/20 hover:bg-white/5'
               }`}>
                 {photo ? (
                   <>
                     <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                     <p className="text-xs font-black text-emerald-500 uppercase tracking-widest text-center">Photo Attached</p>
                     <p className="text-[9px] text-emerald-500/50 uppercase tracking-widest mt-1 text-center">{photo.name}</p>
                   </>
                 ) : (
                   <>
                     <Camera className="w-8 h-8 text-slate-500 mb-2" />
                     <p className="text-xs font-bold text-slate-400 text-center">Tap to capture photo</p>
                   </>
                 )}
               </div>
             </div>
          </div>

          {/* Cold Chain Data Logging */}
          <div className="space-y-3">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ThermometerSnowflake className="w-4 h-4 text-cyan-500" /> Cold Chain Telemetry
             </label>
             <input 
                type="number"
                step="0.1"
                placeholder="Vehicle Temp at Dropoff (°C)"
                value={tempAtDelivery}
                onChange={e => setTempAtDelivery(e.target.value)}
                className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-4 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors placeholder:text-cyan-500/30"
             />
          </div>

        </div>

        <div className="p-6 border-t border-white/5 shrink-0 bg-brand-dark/80">
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-brand-dark font-black tracking-widest uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />} 
            Complete Delivery
          </button>
        </div>

      </div>
    </div>
  );
}
