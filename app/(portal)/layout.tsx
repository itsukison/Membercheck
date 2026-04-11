'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Briefcase, LayoutDashboard, ClipboardCheck, LogOut, CalendarDays, PanelLeftClose, Menu } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalShell>{children}</PortalShell>
    </AuthProvider>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { member, loading, signOut } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Overview', href: '/overview', icon: CalendarDays },
    { name: 'Bookings', href: '/bookings', icon: Briefcase },
    { name: 'Team Members', href: '/admin/members', icon: Users },
  ];

  if (loading || !member) {
    return (
      <div className="h-screen w-full bg-[#fcfbf9] flex items-center justify-center">
        <div className="text-[#777] font-medium">Verifying session…</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#fcfbf9] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className={`border-r border-[#e8e6e1] bg-[#fcfbf9] flex flex-col h-full z-30 transition-all duration-300 ${isCollapsed ? 'hidden md:flex md:-ml-64 md:w-64' : 'w-full md:w-64'}`}>
        <div className="p-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-[#111]">Shion</h1>
            <p className="text-xs text-[#777] uppercase tracking-widest mt-1">{member.name}</p>
          </div>
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="text-[#777] hover:text-[#111] transition-colors hidden md:block"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto flex flex-col pb-4 md:pb-0">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={`flex items-center space-x-3 px-4 py-3 rounded-sm transition-colors whitespace-nowrap ${isActive ? 'bg-[#111] text-white' : 'text-[#777] hover:bg-[#e8e6e1]/50 hover:text-[#111]'}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-[#e8e6e1] flex-shrink-0">
          <button
            onClick={signOut}
            className="flex items-center space-x-3 px-4 py-3 text-[#777] hover:text-[#111] transition-colors w-full text-left"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative h-full flex flex-col overflow-hidden">
        {/* Hamburger Menu when collapsed */}
        {isCollapsed && (
          <div className="absolute top-6 left-6 z-40 hidden md:block">
            <button 
              onClick={() => setIsCollapsed(false)}
              className="p-2 bg-white border border-[#111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] text-[#111] hover:bg-[#fcfbf9] transition-colors flex items-center justify-center"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ 
            backgroundImage: 'linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)', 
            backgroundSize: '32px 32px', 
            backgroundPosition: 'center top' 
          }} 
        />
        <div className={`relative z-10 flex-1 overflow-y-auto p-8 md:p-12 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
