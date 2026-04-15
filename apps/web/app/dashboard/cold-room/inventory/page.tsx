'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Inventory is now handled in the main cold-room hub (FIFO Stock tab).
export default function ColdRoomInventoryRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/cold-room'); }, [router]);
  return (
    <div className="py-40 flex flex-col items-center gap-4 text-blue-400">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-[11px] font-black uppercase tracking-[0.4em]">Redirecting to Cold Room...</span>
    </div>
  );
}
