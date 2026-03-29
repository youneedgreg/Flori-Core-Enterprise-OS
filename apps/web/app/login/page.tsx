"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LoginSchema } from '@flori/shared';
import { z } from 'zod';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      LoginSchema.parse({ email, password });
      
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Set cookie for session (primitive but effective for now)
      document.cookie = `access_token=${data.access_token}; path=/; max-age=3600; samesite=lax`;
      
      // Redirect to onboarding (or dashboard later)
      window.location.href = '/onboarding';
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white inline-flex items-center gap-2 mb-8">
            <span className="text-emerald-500">Flori-</span>Core
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Enter your credentials to access your farm dashboard</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-hidden text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-hidden text-slate-900 dark:text-white"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
