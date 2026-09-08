'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  Sparkles,
  ShieldCheck,
  Database,
  Brain,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ChronicleLogo } from '@/components/chronicle-logo';

export function LandingView() {
  const { signInWithGoogle, signInAsGuest, error, clearError } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      await signInWithGoogle();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsAuthenticating(true);
      await signInAsGuest();
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#EEEEEE]">
      {/* Top Banner / Navbar */}
      <header className="border-b border-[#F0F0F0] bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChronicleLogo size={32} />
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-[#111111] text-base">
                Chronicle Ledger
              </span>
              <span className="hidden sm:inline text-xs px-2.5 py-0.5 rounded-full font-mono text-[#666666] bg-[#F5F5F5] border border-[#EEEEEE]">
                Chronicle Ledger — Production Directives v2.4 Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="header-google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium bg-[#111111] text-white hover:bg-black transition-colors px-4 py-1.5 rounded-full shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
          {/* Brand Monogram Icon */}
          <div className="flex justify-center mb-6">
            <ChronicleLogo size={64} className="drop-shadow-md hover:scale-105 transition-transform duration-200" />
          </div>

          {/* Security & Capability Badges */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F5F5] border border-[#EEEEEE] text-[#666666] text-xs font-mono mb-8 flex-wrap justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
            <span className="font-medium text-[#111111]">Chronicle Ledger — Production Directives v2.4 Active</span>
            <span className="text-[#DDDDDD]">•</span>
            <Database className="w-3.5 h-3.5 text-[#666666]" />
            <span>Strict User-Isolated Firestore</span>
            <span className="text-[#DDDDDD]">•</span>
            <Sparkles className="w-3.5 h-3.5 text-[#666666]" />
            <span>Gemini 3.6 Flash Resilient Ladder</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111111] leading-[1.15] mb-6">
            Chronicle Ledger
          </h1>

          <p className="text-base sm:text-lg text-[#666666] max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            A private space for your thoughts, reflections, and technical work logs. Converse with Gemini across multi-turn sessions to distill insights, synthesize key takeaways, or transform raw development logs into professional updates.
          </p>

          {/* Authentication Action Cards */}
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              id="hero-google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-[#111111] text-white hover:bg-black transition-all font-medium text-sm shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
            </button>

            <button
              id="hero-guest-login-btn"
              onClick={handleGuestSignIn}
              disabled={isAuthenticating}
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-white border border-[#DDDDDD] text-[#666666] hover:text-[#111111] hover:bg-[#F9F9F9] font-medium text-sm transition-colors cursor-pointer"
            >
              Try Instant Demo
            </button>
          </div>

          {/* Auth Error Banner */}
          {error && (
            <div
              id="auth-error-banner"
              className="mt-6 p-4 max-w-md mx-auto rounded-2xl bg-[#FFF8F6] border border-[#F5C6CB] text-[#721C24] text-xs sm:text-sm flex items-start gap-3 text-left"
            >
              <AlertTriangle className="w-4 h-4 text-[#D9534F] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Authentication Notice</p>
                <p className="text-xs text-[#843534] mt-0.5">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-xs font-semibold text-[#843534] hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Feature Architecture Matrix */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] hover:border-[#DDDDDD] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4 text-[#111111]">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-medium text-[#111111] mb-2">
                User-Isolated Firestore
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                Entries are secured under <code className="text-xs bg-[#F5F5F5] px-1.5 py-0.5 rounded text-[#111111] font-mono">/users/{'{userId}'}/interactions</code> with strict owner-bound security rules. Different users cannot access or view each other&apos;s data.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] hover:border-[#DDDDDD] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4 text-[#111111]">
                <Brain className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-medium text-[#111111] mb-2">
                Multi-Turn Reflection Modes
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                Choose between Deep Introspection, Executive Summaries, Creative Brainstorming, or Open Dialogue. Gemini tracks the conversation context to provide meaningful continuity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EEEEEE] hover:border-[#DDDDDD] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-4 text-[#111111]">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-medium text-[#111111] mb-2">
                Complete Persistence
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                Every reflection turn, structured summary, and key takeaway is stored automatically with defensive payload sanitization and zero-crash undefined stripping.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="border-t border-[#EEEEEE] py-8 text-xs text-[#666666] bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-[#111111]">Chronicle Ledger</p>
            <p className="text-[11px] text-[#888888] font-mono">
              Chronicle Ledger — Production Directives v2.4 Active
            </p>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <p id="copyright-text" className="font-medium text-[#222222]">
              © {new Date().getFullYear()} Sathiyamoorthi K. All rights reserved.
            </p>
            <p className="text-[11px] text-[#999999]">
              Built with Next.js App Router • Google Gemini 3.6 Flash • Cloud Firestore
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
