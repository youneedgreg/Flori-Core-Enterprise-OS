'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface Notification {
  id: string | number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  time: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function NotificationFeed({ tenantId }: { tenantId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'initial-1', title: 'System', message: 'Welcome to the dashboard', type: 'INFO', time: '1m ago' },
  ]);

  useEffect(() => {
    const socket: Socket = io(API, { withCredentials: true });

    socket.on('connect', () => {
      console.log('Connected to notifications gateway');
      socket.emit('subscribe-to-notifications', { tenantId });
    });

    socket.on('notification', (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  return (
    <div className="glass p-6 rounded-3xl border border-slate-800 h-full flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-500" />
          Live Feed
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 group transition-all duration-300 backdrop-blur-md">
            <div className="flex gap-4">
              <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5`}>
                {n.type === 'WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : 
                 n.type === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : 
                 <Info className="w-4 h-4 text-blue-500" />}
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="text-sm font-bold text-slate-200">{n.title}</h4>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{n.time}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <Bell className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm">No new notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
