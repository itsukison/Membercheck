'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black shrink-0 mt-1">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
  </svg>
);

export default function Page() {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      {/* Navigation Header */}
      <header className="w-full flex flex-wrap justify-between items-center p-6 md:px-12 border-b border-[#e8e6e1]">
        <div className="font-serif text-2xl text-[#111]">Opennote</div>
        <nav className="flex flex-wrap gap-4 md:gap-6 text-sm font-medium text-[#777] mt-4 md:mt-0">
          <Link href="/login" className="hover:text-[#111] transition-colors">Login</Link>
          <Link href="/dashboard" className="hover:text-[#111] transition-colors">Dashboard</Link>
          <Link href="/overview" className="hover:text-[#111] transition-colors">Overview</Link>
          <Link href="/bookings" className="hover:text-[#111] transition-colors">Bookings</Link>
          <Link href="/admin/members" className="hover:text-[#111] transition-colors">Team</Link>
        </nav>
      </header>

      <div className="flex-1 flex items-center justify-center p-8 md:p-24">
        <div className="max-w-[1000px] w-full grid grid-cols-1 md:grid-cols-[1fr_400px] gap-16 md:gap-32 items-center">
        
        {/* Left Column - Text Content */}
        <div className="flex flex-col space-y-12">
          <h1 className="font-serif text-[44px] md:text-[52px] text-[#111] leading-[1.15] tracking-tight">
            Built for how<br />you learn
          </h1>

          <div className="space-y-6">
            {/* Tab 1 */}
            <div className="flex flex-col">
              <button 
                onClick={() => setActiveTab('students')}
                className="flex items-start space-x-4 text-left group"
              >
                <SparkleIcon />
                <div className="flex flex-col">
                  <span className="text-[17px] text-[#111]">
                    For students
                  </span>
                  <AnimatePresence>
                    {activeTab === 'students' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-[#777] text-[15px] leading-[1.6] max-w-[320px]">
                          Consolidate all your lecture materials, notes, and readings. When something doesn't click, the AI breaks it down and helps you practice.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>

            {/* Tab 2 */}
            <div className="flex flex-col">
              <button 
                onClick={() => setActiveTab('self-learners')}
                className="flex items-center space-x-4 text-left group"
              >
                <SparkleIcon />
                <span className="text-[17px] text-[#111]">
                  For self-learners
                </span>
              </button>
            </div>

            {/* Tab 3 */}
            <div className="flex flex-col">
              <button 
                onClick={() => setActiveTab('researchers')}
                className="flex items-center space-x-4 text-left group"
              >
                <SparkleIcon />
                <span className="text-[17px] text-[#111]">
                  For researchers
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Illustration & Testimonial */}
        <div className="relative w-full aspect-[3/4] bg-[#fcfbf9] overflow-hidden">
          {/* Grid Background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              backgroundPosition: 'center top'
            }}
          />
          
          {/* Illustration Area */}
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-24">
            <div className="relative w-full max-w-[280px] aspect-square">
               <div className="absolute inset-0 flex items-center justify-center">
                 {/* Hand-drawn style SVG representation */}
                 <svg viewBox="0 0 300 300" className="w-[120%] h-[120%] -ml-4 -mt-8 text-[#111]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Banner */}
                    <path d="M70 110 Q 150 160 230 110" fill="white" />
                    <path d="M70 110 Q 150 160 230 110 L 220 80 Q 150 130 80 80 Z" fill="white" />
                    <path d="M70 110 Q 150 160 230 110" />
                    <path d="M220 80 Q 150 130 80 80" />
                    <path d="M70 110 L 80 80" />
                    <path d="M230 110 L 220 80" />
                    
                    <text x="150" y="125" textAnchor="middle" className="font-sans text-2xl" stroke="none" fill="currentColor" style={{ transform: 'rotate(-2deg)', transformOrigin: '150px 125px' }}>E=MC²</text>
                    
                    {/* Left Bird */}
                    <path d="M50 90 Q 60 85 75 95 Q 65 100 50 90 Z" fill="currentColor" stroke="none" />
                    <path d="M75 95 Q 85 90 90 80 Q 80 85 75 95 Z" fill="currentColor" stroke="none" />
                    <circle cx="75" cy="95" r="4" fill="currentColor" stroke="none" />
                    
                    {/* Right Bird */}
                    <path d="M250 85 Q 240 80 225 90 Q 235 95 250 85 Z" fill="currentColor" stroke="none" />
                    <path d="M225 90 Q 215 85 210 75 Q 220 80 225 90 Z" fill="currentColor" stroke="none" />
                    <circle cx="225" cy="90" r="4" fill="currentColor" stroke="none" />

                    {/* Person */}
                    {/* Legs */}
                    <path d="M100 170 Q 110 140 120 140 Q 130 140 135 170" fill="white" />
                    <path d="M125 170 Q 135 145 145 145 Q 155 145 160 170" fill="white" />
                    <path d="M100 170 L 80 165 L 120 185" fill="white" />
                    <path d="M135 170 L 160 170" fill="white" />
                    
                    {/* Torso */}
                    <path d="M130 185 Q 160 160 180 160 L 190 185 Z" fill="white" />
                    
                    {/* Pink Top */}
                    <path d="M155 170 Q 165 165 175 175 Q 185 165 190 170 L 185 185 Q 175 180 165 190 Q 155 180 150 185 Z" fill="#ff4d94" stroke="none" />
                    <path d="M155 170 Q 165 165 175 175 Q 185 165 190 170" />
                    <path d="M150 185 Q 155 180 165 190 Q 175 180 185 185" />
                    
                    {/* Arms */}
                    <path d="M150 165 Q 140 180 130 185" fill="none" />
                    <path d="M180 160 Q 195 160 200 180 L 190 185" fill="none" />
                    
                    {/* Head */}
                    <circle cx="170" cy="145" r="12" fill="white" />
                    <circle cx="185" cy="140" r="6" fill="currentColor" stroke="none" />
                    <path d="M165 135 Q 175 130 180 140 Z" fill="currentColor" stroke="none" />
                    <path d="M160 145 Q 165 145 165 150" fill="none" strokeWidth="1.5" />
                 </svg>
               </div>
            </div>
          </div>

          {/* Testimonial Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-10 pt-24 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/90 to-transparent">
            <p className="font-serif text-[22px] text-[#111] leading-[1.3] mb-3">
              "I almost don't use Google Drive anymore. Opennote centralizes everything."
            </p>
            <p className="text-[#888] text-[15px]">
              Vince, Graduate student
            </p>
          </div>
        </div>

        </div>

      </div>
    </div>
  );
}
