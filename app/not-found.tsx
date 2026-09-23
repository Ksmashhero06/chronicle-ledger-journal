import React from 'react';
import Link from 'next/link';
import { ChronicleLogo } from '@/components/chronicle-logo';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#111111] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#111111] selection:text-white">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ChronicleLogo size={24} className="group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-sm tracking-tight text-[#111111]">
            Chronicle Ledger
          </span>
        </Link>
        <span className="text-[11px] font-mono text-[#888888] uppercase tracking-wider">
          Error 404
        </span>
      </header>

      {/* Main Error Content */}
      <main className="max-w-xl mx-auto w-full my-auto py-12 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs flex items-center justify-center mx-auto text-[#666666]">
          <Compass className="w-7 h-7 text-[#444444]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#888888]">
            Resource Not Located
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
            That page isn&apos;t here.
          </h1>
          <p className="text-sm text-[#666666] leading-relaxed max-w-md mx-auto">
            The record or page you were looking for may have moved, been renamed, or the link may be incorrect. Your saved projects and evidence remain safe.
          </p>
        </div>

        {/* Primary User Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        {/* Reference ID */}
        <div className="pt-6 border-t border-[#EEEEEE] text-[11px] font-mono text-[#999999]">
          <span>Reference: </span>
          <span className="text-[#666666] font-semibold">CL-404NF</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#999999] max-w-4xl mx-auto w-full font-mono">
        Chronicle Ledger • Verification &amp; Readiness Platform
      </footer>
    </div>
  );
}
