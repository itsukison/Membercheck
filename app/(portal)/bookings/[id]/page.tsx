'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, MapPin, Clock, Calendar as CalIcon } from 'lucide-react';

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/bookings" className="inline-flex items-center space-x-2 text-[#777] hover:text-[#111] transition-colors">
        <ArrowLeft size={18} />
        <span>Back to Bookings</span>
      </Link>

      <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-[#ff4d94] font-bold tracking-wider uppercase">SH-800{resolvedParams.id}</span>
            <span className="bg-[#111] text-white text-xs px-2 py-1 font-medium">Confirmed</span>
          </div>
          <h1 className="font-serif text-4xl text-[#111]">Alice & Bob Wedding</h1>
        </div>
        <button className="flex items-center space-x-2 bg-[#25D366] text-white px-6 py-3 font-medium hover:bg-[#128C7E] transition-colors shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] border border-[#111]">
          <MessageCircle size={20} />
          <span>Open WhatsApp</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="bg-white border border-[#111] p-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
            <h2 className="font-serif text-2xl text-[#111] mb-6 border-b border-[#e8e6e1] pb-2">Event Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-sm text-[#777] mb-1">Date</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <CalIcon size={18} className="text-[#ff4d94]" />
                  <span>April 15, 2026</span>
                </div>
              </div>
              <div>
                <span className="block text-sm text-[#777] mb-1">Time</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <Clock size={18} className="text-[#ff4d94]" />
                  <span>14:00 - 18:00 (4 hours)</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-sm text-[#777] mb-1">Location</span>
                <div className="flex items-center space-x-2 text-[#111] font-medium">
                  <MapPin size={18} className="text-[#ff4d94]" />
                  <span>Jeju Island (East Coast Route)</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[#111] p-8 shadow-[4px_4px_0px_0px_rgba(17,17,17,1)]">
            <h2 className="font-serif text-2xl text-[#111] mb-6 border-b border-[#e8e6e1] pb-2">Client Notes</h2>
            <p className="text-[#444] leading-relaxed">
              Client requested a focus on candid moments. They are bringing their own props (vintage camera, umbrellas). Please ensure to capture the sunset at the final location.
            </p>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-[#fcfbf9] border border-[#111] p-6">
            <h3 className="font-serif text-xl text-[#111] mb-4">Client Info</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Name</span>
                <span className="text-[#111] font-medium">Alice Smith</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Email</span>
                <span className="text-[#111] font-medium">alice@example.com</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Phone</span>
                <span className="text-[#111] font-medium">+82 10-1234-5678</span>
              </div>
              <div>
                <span className="block text-xs text-[#777] uppercase tracking-wider">Group Size</span>
                <span className="text-[#111] font-medium">2 People</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <button className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors">
              Mark Payment Confirmed
            </button>
            <button className="w-full border border-[#111] bg-white py-3 font-medium text-[#111] hover:bg-[#111] hover:text-white transition-colors">
              Mark as Completed
            </button>
            <button className="w-full border border-[#ff4d94] text-[#ff4d94] py-3 font-medium hover:bg-[#ff4d94] hover:text-white transition-colors">
              Cancel Booking
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
