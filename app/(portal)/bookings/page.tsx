'use client';
import React from 'react';
import Link from 'next/link';
import { Search, Filter, CalendarDays } from 'lucide-react';

export default function Bookings() {
  const groupedBookings = {
    'April 15, 2026': [
      { id: 1, ref: 'SH-8001', client: 'Alice & Bob', time: '14:00 - 18:00', location: 'Jeju Island', assignedTo: 'Sarah Jenkins', status: 'Confirmed' },
    ],
    'April 18, 2026': [
      { id: 2, ref: 'SH-8002', client: 'Charlie Family', time: '10:00 - 12:00', location: 'Seoul Studio', assignedTo: 'David Kim', status: 'Pending' },
      { id: 4, ref: 'SH-8004', client: 'Yoon Family', time: '14:00 - 16:00', location: 'Seoul Studio', assignedTo: 'Elena Rossi', status: 'Confirmed' },
    ],
    'April 20, 2026': [
      { id: 3, ref: 'SH-8003', client: 'David & Eve', time: '16:00 - 20:00', location: 'Busan Beach', assignedTo: 'Sarah Jenkins', status: 'Completed' },
    ]
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl text-[#111]">Bookings</h1>
          <p className="text-[#777] mt-2">Manage and view all scheduled shoots.</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={18} />
            <input 
              type="text" 
              placeholder="Search reference..." 
              className="pl-10 pr-4 py-2 border border-[#111] bg-white focus:outline-none focus:border-[#ff4d94]" 
            />
          </div>
          <button className="flex items-center space-x-2 border border-[#111] bg-white px-4 py-2 hover:bg-[#fcfbf9]">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className="space-y-10">
        {Object.entries(groupedBookings).map(([date, bookings]) => (
          <div key={date} className="space-y-4">
            <h2 className="font-serif text-2xl text-[#111] flex items-center space-x-2 border-b border-[#e8e6e1] pb-2">
              <CalendarDays size={20} className="text-[#ff4d94]" />
              <span>{date}</span>
            </h2>
            <div className="bg-white border border-[#111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#fcfbf9] border-b border-[#111]">
                      <th className="p-4 font-medium text-[#111]">Ref</th>
                      <th className="p-4 font-medium text-[#111]">Client</th>
                      <th className="p-4 font-medium text-[#111]">Time</th>
                      <th className="p-4 font-medium text-[#111]">Location</th>
                      <th className="p-4 font-medium text-[#111]">Assigned To</th>
                      <th className="p-4 font-medium text-[#111]">Status</th>
                      <th className="p-4 font-medium text-[#111]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-[#e8e6e1] hover:bg-[#fcfbf9]/50 transition-colors last:border-b-0">
                        <td className="p-4 text-[#ff4d94] font-medium">{b.ref}</td>
                        <td className="p-4 text-[#111] font-medium">{b.client}</td>
                        <td className="p-4 text-[#777]">{b.time}</td>
                        <td className="p-4 text-[#777]">{b.location}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center space-x-1.5 bg-[#fcfbf9] border border-[#e8e6e1] px-2 py-1 text-xs font-medium text-[#111]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#111]"></span>
                            <span>{b.assignedTo}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-medium ${b.status === 'Confirmed' ? 'bg-[#111] text-white' : b.status === 'Completed' ? 'bg-[#e8e6e1] text-[#777]' : 'border border-[#111] text-[#111]'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link href={`/bookings/${b.id}`} className="text-[#111] hover:text-[#ff4d94] font-medium text-sm underline underline-offset-2">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
