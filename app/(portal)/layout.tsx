'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Briefcase, LayoutDashboard, LogOut, CalendarDays, PanelLeftClose, Menu, X } from 'lucide-react';
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
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut();
  };

  const nav = (
    <>
      <div className="p-6 md:p-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[#111]">Shion</h1>
          <p className="text-xs text-[#777] uppercase tracking-widest mt-1">{member.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDesktopCollapsed(true)}
            className="text-[#777] hover:text-[#111] transition-colors hidden md:block"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={20} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#777] hover:text-[#111] transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto flex flex-col pb-4 md:pb-0">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
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
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-3 text-[#777] hover:text-[#111] transition-colors w-full text-left"
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:h-screen w-full bg-[#fcfbf9] flex flex-col md:flex-row md:overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 border-b border-[#e8e6e1] bg-[#fcfbf9] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl text-[#111]">Shion</h1>
          <p className="text-[10px] text-[#777] uppercase tracking-widest mt-0.5">{member.name}</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 border border-[#111] bg-white text-[#111] hover:bg-[#fcfbf9] transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className={`border-r border-[#e8e6e1] bg-[#fcfbf9] flex-col h-full z-30 transition-all duration-300 hidden md:flex ${isDesktopCollapsed ? '-ml-64 w-64' : 'w-64'}`}>
        {nav}
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <button
            aria-label="Close navigation backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/30"
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[85%] max-w-xs border-r border-[#e8e6e1] bg-[#fcfbf9] flex flex-col">
            {nav}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 relative h-full flex flex-col min-h-0">
        {/* Hamburger Menu when collapsed */}
        {isDesktopCollapsed && (
          <div className="absolute top-6 left-6 z-40 hidden md:block">
            <button
              onClick={() => setIsDesktopCollapsed(false)}
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
        <div className={`relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 transition-all duration-300 ${isDesktopCollapsed ? 'md:pl-20' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
