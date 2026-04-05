/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, QrCode } from 'lucide-react';

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
      // Assuming GET /api/pack-house/batches returns all batches
      const response = await fetch('/api/pack-house/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      // Only show batches that are GRADED
      setBatches(data.filter((b: any) => b.status === 'GRADED'));
    } catch (error) {
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
      const response = await fetch('/api/packing/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Packing Station</h2>
        <p className="text-muted-foreground">Scan batches and generate box labels.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Batch & Grade Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Select Batch (Scan)</Label>
              <Select value={selectedBatchId} onValueChange={(val) => setSelectedBatchId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batchNumber} - {batch.variety.name}
                    </SelectItem>
                  ))}
                  {batches.length === 0 && (
                    <SelectItem value="none" disabled>No graded batches available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade being Packed</Label>
              <Select value={grade} onValueChange={(val) => setGrade(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Box Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bunchSize">Bunch Size (Stems)</Label>
                <Input 
                  id="bunchSize" 
                  type="number" 
                  min="1" 
                  value={bunchSize} 
                  onChange={(e) => setBunchSize(parseInt(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bunchesPerBox">Bunches per Box</Label>
                <Input 
                  id="bunchesPerBox" 
                  type="number" 
                  min="1" 
                  value={bunchesPerBox} 
                  onChange={(e) => setBunchesPerBox(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Total Stems / Box:</span>
              <span className="text-2xl font-bold bg-slate-100 px-3 py-1 rounded-md">{totalStems}</span>
            </div>

            <Button 
              className="w-full h-12 text-lg mt-4" 
              onClick={handlePack}
              disabled={isPacking || !selectedBatchId || totalStems <= 0}
            >
              {isPacking ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Packing...</>
              ) : (
                <><Package className="mr-2 h-5 w-5" /> Pack & Generate Label</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {lastPackedLabelUrl && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
             <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <QrCode className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium text-slate-800">Label Generated Successfully!</h3>
                <p className="text-slate-600 text-center max-w-md">
                  Attach this label to the box. The QR code contains all necessary tracking data for cold room entry and dispatch.
                </p>
                <a 
                  href={lastPackedLabelUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ variant: "outline" })} border-green-300 hover:bg-green-100`}
                >
                  Open Label PDF
                </a>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
