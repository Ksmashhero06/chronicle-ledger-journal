'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { LandingView } from '@/components/landing-view';
import { JournalDashboard } from '@/components/journal-dashboard';
import { RotateCw } from 'lucide-react';
import { ChronicleLogo } from '@/components/chronicle-logo';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center text-[#1A1A1A]">
        <div className="mb-4">
          <ChronicleLogo size={48} />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#666666]">
          <RotateCw className="w-3.5 h-3.5 animate-spin text-[#999999]" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingView />;
  }

  return <JournalDashboard />;
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
