/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, QrCode } from 'lucide-react';
import { isTokenExpired, logout } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// For simplicity, we define basic types inline
type Batch = {
  id: string;
  batchNumber: string;
  varietyId: string;
  variety: { name: string; targetStemLength: number; targetStemCountPerSqm: number };
  qcLogs: any[];
};

export default function PackingStationPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [bunchSize, setBunchSize] = useState<number>(10);
  const [bunchesPerBox, setBunchesPerBox] = useState<number>(20);
  const [grade, setGrade] = useState<string>('A');
  const [isPacking, setIsPacking] = useState(false);
  const [lastPackedLabelUrl, setLastPackedLabelUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      // Assuming GET /pack-house/batches returns all batches
      const response = await fetch(`${API}/pack-house/batches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      // Only show batches that are GRADED
      setBatches(data.filter((b: any) => b.status === 'GRADED'));
    } catch {
      toast.error('Error', { description: 'Could not load batches.' });
    }
  };

  const handlePack = async () => {
    if (!selectedBatchId) {
      toast.error('Error', { description: 'Please select a batch first.' });
      return;
    }

    const selectedBatch = batches.find((b) => b.id === selectedBatchId);
    if (!selectedBatch) return;

    setIsPacking(true);
    setLastPackedLabelUrl(null);

    try {
      const tokenMatch = document.cookie.match(/access_token=([^;]+)/);
      const token = tokenMatch?.[1];

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const response = await fetch(`${API}/packing/pack`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          batchId: selectedBatchId,
          varietyId: selectedBatch.varietyId,
          grade,
          bunchSize: Number(bunchSize),
          bunchesPerBox: Number(bunchesPerBox),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to pack box');
      }

      const box = await response.json();
      
      toast.success('Box Packed Successfully', {
        description: `Box ID: ${box.boxId}`,
      });

      if (box.labelUrl) {
        setLastPackedLabelUrl(box.labelUrl);
      }
      
      // Refresh to update available inventory
      fetchBatches();
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsPacking(false);
    }
  };

  const totalStems = bunchSize * bunchesPerBox;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-white">
            Packing <span className="text-brand-green">Station</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">Scan batches, configure box sizes, and generate high-resolution tracking labels.</p>
        </div>
      </header>

      <div className="w-full grid gap-10 lg:grid-cols-12">
        {/* Left Column: Selection & Config */}
        <div className="w-full lg:col-span-7 space-y-8">
          <div className="w-full bg-white/5 backdrop-blur-3xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             {/* Glow */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full transition-all group-hover:bg-brand-green/10" />

             <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                  <Package className="w-6 h-6 text-brand-green" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Batch Selection</h3>
             </div>

             <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="batch" className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1 cursor-pointer">Select Batch (Scan / Search)</Label>
                  <Select value={selectedBatchId} onValueChange={(val) => setSelectedBatchId(val || '')}>
                    <SelectTrigger id="batch" className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold focus:border-brand-green/30 focus:ring-brand-green/5">
                      <SelectValue placeholder="Select a batch..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id} className="focus:bg-brand-green/10 focus:text-brand-green rounded-xl py-3">
                          {batch.batchNumber} - {batch.variety.name}
                        </SelectItem>
                      ))}
                      {batches.length === 0 && (
                        <SelectItem value="none" disabled>No graded batches available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="grade" className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1 cursor-pointer">Grade being Packed</Label>
                  <Select value={grade} onValueChange={(val) => setGrade(val || '')}>
                    <SelectTrigger id="grade" className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold focus:border-brand-green/30 focus:ring-brand-green/5">
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                      <SelectItem value="A" className="focus:bg-brand-green/10 focus:text-brand-green rounded-xl py-3">Grade A (Premium)</SelectItem>
                      <SelectItem value="B" className="focus:bg-brand-green/10 focus:text-brand-green rounded-xl py-3">Grade B (Standard)</SelectItem>
                      <SelectItem value="C" className="focus:bg-brand-green/10 focus:text-brand-green rounded-xl py-3">Grade C (Bulk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
          </div>

          <div className="w-full bg-white/5 backdrop-blur-3xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
             <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Box Configuration</h3>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="bunchSize" className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Bunch Size (Stems)</Label>
                  <Input 
                    id="bunchSize" 
                    type="number" 
                    min="1" 
                    className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold focus:border-brand-green/30 focus:ring-brand-green/5 px-6"
                    value={bunchSize} 
                    onChange={(e) => setBunchSize(parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="bunchesPerBox" className="text-sm font-black uppercase tracking-widest text-slate-500 ml-1">Bunches per Box</Label>
                  <Input 
                    id="bunchesPerBox" 
                    type="number" 
                    min="1" 
                    className="bg-white/5 border-white/10 rounded-2xl h-14 text-white font-bold focus:border-brand-green/30 focus:ring-brand-green/5 px-6"
                    value={bunchesPerBox} 
                    onChange={(e) => setBunchesPerBox(parseInt(e.target.value) || 0)} 
                  />
                </div>
             </div>

             <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-500">Total Stems per Box</span>
                  <p className="text-slate-400 text-xs font-medium">Auto-calculated based on configuration</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-4xl font-black text-brand-green">{totalStems}</div>
                   <div className="text-[10px] uppercase font-black tracking-widest text-slate-600 bg-white/5 px-2 py-1 rounded-md border border-white/5">Stems</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Actions & Results */}
        <div className="w-full lg:col-span-12 xl:col-span-5 space-y-8 xl:sticky xl:top-8">
           <div className="w-full bg-linear-to-br from-brand-green/20 to-brand-green/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-brand-green/20 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              <h3 className="text-2xl font-black text-white mb-6 relative z-10">Finalize Packing</h3>
              <p className="text-slate-300 font-medium mb-8 leading-relaxed relative z-10">
                Confirming this action will log the packed items into the finished goods inventory and generate a unique tracking QR ID.
              </p>

              <Button 
                className="w-full h-16 text-xl font-black bg-brand-green text-brand-dark hover:bg-emerald-400 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] relative z-10 group/pack" 
                onClick={handlePack}
                disabled={isPacking || !selectedBatchId || totalStems <= 0}
              >
                {isPacking ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Processing...</>
                ) : (
                  <><Package className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" /> Pack & Generate Label</>
                )}
              </Button>
           </div>

           {lastPackedLabelUrl && (
             <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                
                <div className="flex flex-col items-center justify-center space-y-6 relative z-10">
                    <div className="w-20 h-20 bg-brand-green/20 rounded-[2rem] flex items-center justify-center text-brand-green border border-brand-green/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <QrCode className="h-10 w-10 rotate-3" />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-white">Label Ready!</h3>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                        High-resolution tracking label generated and archived. Attach to physical unit immediately.
                      </p>
                    </div>

                    <a 
                      href={lastPackedLabelUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/10 hover:border-white/20 font-bold transition-all flex items-center justify-center gap-3">
                        View Label PDF
                      </Button>
                    </a>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
