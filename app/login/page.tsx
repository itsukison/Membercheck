'use client';
import React from 'react';
import Link from 'next/link';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#fcfbf9] relative overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)', 
          backgroundSize: '32px 32px', 
          backgroundPosition: 'center top' 
        }} 
      />
      
      <div className="relative z-10 w-full max-w-md bg-[#fcfbf9] p-10 border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
        <h1 className="font-serif text-4xl text-[#111] mb-2">Team Portal</h1>
        <p className="text-[#777] mb-8">Sign in to manage your schedule.</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none" 
              placeholder="you@shion.photography" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111] mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-transparent border-b-2 border-[#111] py-2 focus:outline-none focus:border-[#ff4d94] transition-colors rounded-none" 
              placeholder="••••••••" 
            />
          </div>
          <Link 
            href="/dashboard" 
            className="block w-full bg-[#111] text-white text-center py-3 font-medium hover:bg-[#ff4d94] transition-colors mt-8"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
