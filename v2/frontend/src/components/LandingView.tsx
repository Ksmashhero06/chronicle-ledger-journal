import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ShieldCheck,
  Database,
  Brain,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { ChronicleLogo } from './ChronicleLogo';

export const LandingView: React.FC = () => {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FDFDFD', color: '#1A1A1A', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)' }}>
      {/* Top Banner / Navbar */}
      <header style={{ borderBottom: '1px solid #F0F0F0', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ChronicleLogo size={32} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, letterSpacing: '-0.02em', color: '#111111', fontSize: '1rem' }}>
                Chronicle Ledger
              </span>
              <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.65rem', borderRadius: '9999px', fontFamily: 'var(--font-mono)', color: '#666666', background: '#F5F5F5', border: '1px solid #EEEEEE' }}>
                Chronicle Ledger — Production Directives v2.4 Active
              </span>
            </div>
          </div>

          <div>
            <button
              id="header-google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 500,
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '0.45rem 1rem',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24">
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
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
          {/* Brand Monogram Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <ChronicleLogo size={64} />
          </div>

          {/* Security & Capability Badges */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              borderRadius: '9999px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #EEEEEE',
              color: '#666666',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={14} color="#111111" />
            <span style={{ fontWeight: 600, color: '#111111' }}>Chronicle Ledger — Production Directives v2.4 Active</span>
            <span style={{ color: '#DDDDDD' }}>•</span>
            <Database size={14} color="#666666" />
            <span>Strict User-Isolated Firestore</span>
            <span style={{ color: '#DDDDDD' }}>•</span>
            <Sparkles size={14} color="#666666" />
            <span>Gemini 3.6 Flash Resilient Ladder</span>
          </div>

          <h1 style={{ fontSize: '3.2rem', fontWeight: 600, letterSpacing: '-0.03em', color: '#111111', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Chronicle Ledger
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#666666', maxWidth: '672px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            A private space for your thoughts, reflections, and technical work logs. Converse with Gemini across multi-turn sessions to distill insights, synthesize key takeaways, or transform raw development logs into professional updates.
          </p>

          {/* Authentication Action Buttons */}
          <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              id="hero-google-login-btn"
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
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
              <ArrowRight size={15} style={{ opacity: 0.7 }} />
            </button>

            <button
              id="hero-guest-login-btn"
              onClick={handleGuestSignIn}
              disabled={isAuthenticating}
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #DDDDDD',
                color: '#666666',
                fontWeight: 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Try Instant Demo
            </button>
          </div>

          {/* Auth Error Banner */}
          {error && (
            <div
              id="auth-error-banner"
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                maxWidth: '420px',
                margin: '1.5rem auto 0 auto',
                borderRadius: '16px',
                backgroundColor: '#FFF8F6',
                border: '1px solid #F5C6CB',
                color: '#721C24',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                textAlign: 'left',
              }}
            >
              <AlertTriangle size={16} color="#D9534F" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600 }}>Authentication Notice</p>
                <p style={{ fontSize: '0.75rem', color: '#843534', marginTop: '2px' }}>{error}</p>
              </div>
              <button
                onClick={clearError}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: '#843534', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 3-Card Feature Grid */}
          <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            <div style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#111111' }}>
                <Lock size={16} />
              </div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111111', marginBottom: '0.5rem' }}>
                User-Isolated Firestore & Ledger
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#666666', lineHeight: 1.55 }}>
                Entries and verification records are secured under <code style={{ fontSize: '0.75rem', backgroundColor: '#F5F5F5', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#111111', fontFamily: 'var(--font-mono)' }}>/users/{'{userId}'}</code> with strict owner-bound rules.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#111111' }}>
                <Brain size={16} />
              </div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111111', marginBottom: '0.5rem' }}>
                Multi-Turn Reflection & Verification
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#666666', lineHeight: 1.55 }}>
                Choose between Socratic Reflection, DevLog LinkedIn synthesis, Brainstorming, and Evidence-Grounded Requirement Verification powered by Bedrock & AST.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#111111' }}>
                <Database size={16} />
              </div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111111', marginBottom: '0.5rem' }}>
                Complete Cryptographic Persistence
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#666666', lineHeight: 1.55 }}>
                Every reflection turn, structured summary, and evidence citation is fingerprinted with SHA-256 and stored automatically with zero data loss.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" style={{ borderTop: '1px solid #EEEEEE', padding: '2rem 1.5rem', fontSize: '0.75rem', color: '#666666', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontWeight: 600, color: '#111111' }}>Chronicle Ledger</p>
            <p style={{ fontSize: '0.7rem', color: '#888888', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Chronicle Ledger — Production Directives v2.4 Active
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p id="copyright-text" style={{ fontWeight: 500, color: '#222222' }}>
              © {new Date().getFullYear()} Sathiyamoorthi K. All rights reserved.
            </p>
            <p style={{ fontSize: '0.7rem', color: '#999999', marginTop: '2px' }}>
              Built with Next.js App Router • Google Gemini 3.6 Flash • Amazon Bedrock • Cloud Firestore
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
