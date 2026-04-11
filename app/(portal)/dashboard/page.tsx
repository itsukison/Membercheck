'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalIcon, Clock, MapPin, Check, X } from 'lucide-react';

export default function Dashboard() {
  const [pending, setPending] = useState([
    { id: 1, ref: 'SH-8004', client: 'Yoon Family', date: 'Apr 22, 2026', time: '14:00 - 18:00', location: 'Seoul Studio' },
    { id: 2, ref: 'SH-8005', client: 'James & Lily', date: 'Apr 25, 2026', time: '10:00 - 14:00', location: 'Jeju Island' },
  ]);

  const todayBookings = [
    { id: 3, ref: 'SH-8001', client: 'Alice & Bob', time: '14:00 - 18:00', location: 'Jeju Island', status: 'Confirmed' },
  ];

  const handleConfirm = (id: number) => {
    setPending(pending.filter(b => b.id !== id));
    // In a real app, this would move the booking to confirmed state
  };

  const handleReject = (id: number) => {
    setPending(pending.filter(b => b.id !== id));
    // In a real app, this would release the booking back to the pool
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header>
        <h1 className="font-serif text-4xl text-[#111]">Welcome back, Sarah</h1>
        <p className="text-[#777] mt-2">Here is your schedule and pending assignments.</p>
      </header>

      {/* Pending Assignments */}
      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-[#111] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4d94]"></span>
            <span>Pending Auto-Assignments</span>
          </h2>
          <p className="text-sm text-[#777] mb-4">These bookings were automatically assigned to you based on your availability. Please confirm or reject them.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map(b => (
              <div key={b.id} className="bg-white border border-[#ff4d94] p-6 shadow-[4px_4px_0px_0px_rgba(255,77,148,0.2)] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[#ff4d94] font-bold tracking-wider uppercase text-sm">{b.ref}</span>
                    <span className="bg-[#ff4d94]/10 text-[#ff4d94] text-xs px-2 py-1 font-medium">Action Required</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-[#111]">{b.client}</h3>
                    <Link href={`/bookings/${b.id}`} className="text-sm font-medium text-[#111] underline underline-offset-2 hover:text-[#ff4d94] transition-colors">
                      View Details
                    </Link>
                  </div>
                  <div className="space-y-3 text-sm text-[#777]">
                    <div className="flex items-center space-x-3"><CalIcon size={16} className="text-[#111]" /><span>{b.date}</span></div>
                    <div className="flex items-center space-x-3"><Clock size={16} className="text-[#111]" /><span>{b.time}</span></div>
                    <div className="flex items-center space-x-3"><MapPin size={16} className="text-[#111]" /><span>{b.location}</span></div>
                  </div>
                </div>
                <div className="flex space-x-3 mt-8">
                  <button onClick={() => handleConfirm(b.id)} className="flex-1 flex items-center justify-center space-x-2 bg-[#111] text-white py-2.5 hover:bg-[#ff4d94] transition-colors font-medium">
                    <Check size={16} /><span>Confirm</span>
                  </button>
                  <button onClick={() => handleReject(b.id)} className="flex-1 flex items-center justify-center space-x-2 border border-[#111] text-[#111] py-2.5 hover:bg-[#fcfbf9] transition-colors font-medium">
                    <X size={16} /><span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Today's Bookings */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#111]">Today's Bookings</h2>
        <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
          {todayBookings.length > 0 ? (
            <div className="divide-y divide-[#e8e6e1]">
              {todayBookings.map(b => (
                <div key={b.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#fcfbf9] transition-colors">
                  <div className="flex items-center space-x-6">
                    <div className="text-center min-w-[80px]">
                      <span className="block text-lg font-bold text-[#111]">{b.time.split(' - ')[0]}</span>
                      <span className="block text-xs text-[#777] uppercase tracking-wider">Start</span>
                    </div>
                    <div className="w-px h-12 bg-[#e8e6e1] hidden sm:block"></div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-[#ff4d94] font-bold tracking-wider uppercase text-xs">{b.ref}</span>
                        <span className="bg-[#111] text-white text-[10px] px-2 py-0.5 uppercase tracking-wider">{b.status}</span>
                      </div>
                      <h3 className="text-lg font-medium text-[#111]">{b.client}</h3>
                      <div className="flex items-center space-x-2 text-sm text-[#777] mt-1">
                        <MapPin size={14} /><span>{b.location}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/bookings/${b.id}`} className="border border-[#111] px-4 py-2 text-sm font-medium hover:bg-[#111] hover:text-white transition-colors text-center">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[#777]">
              No bookings scheduled for today.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
