'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  WifiOff,
  Clock,
  Lock,
  FileWarning,
  RotateCw,
  Home,
  ChevronDown,
  ChevronUp,
  LogIn,
} from 'lucide-react';
import { ChronicleLogo } from './chronicle-logo';

export type ProductErrorKind =
  | '401_SESSION_REQUIRED'
  | '403_ACCESS_DENIED'
  | '429_RATE_LIMITED'
  | '500_UNEXPECTED'
  | '502_UNAVAILABLE'
  | '504_TIMEOUT'
  | 'OFFLINE'
  | 'FILE_UNSUPPORTED'
  | 'FILE_TOO_LARGE'
  | 'FILE_CORRUPT'
  | 'EXTRACTION_FAILED'
  | 'VERIFICATION_UNAVAILABLE';

interface ProductErrorViewProps {
  kind: ProductErrorKind;
  referenceId?: string;
  technicalDetails?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  onGoHome?: () => void;
}

export function ProductErrorView({
  kind,
  referenceId,
  technicalDetails,
  onRetry,
  onDismiss,
  onGoHome,
}: ProductErrorViewProps) {
  const [showDetails, setShowDetails] = useState(false);
  const refCode = referenceId || `CL-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

  const configMap: Record<
    ProductErrorKind,
    {
      label: string;
      title: string;
      explanation: string;
      reassurance?: string;
      icon: React.ReactNode;
      primaryActionLabel: string;
      primaryAction: () => void;
      secondaryActionLabel?: string;
      secondaryAction?: () => void;
    }
  > = {
    '401_SESSION_REQUIRED': {
      label: 'Authentication Required',
      title: 'Your session has ended.',
      explanation: 'Please sign in again to view your projects and verify requirements.',
      reassurance: 'Your previously saved work is securely preserved.',
      icon: <Lock className="w-6 h-6 text-[#111111]" />,
      primaryActionLabel: 'Sign In',
      primaryAction: () => (window.location.href = '/'),
      secondaryActionLabel: 'Dashboard',
      secondaryAction: onGoHome,
    },
    '403_ACCESS_DENIED': {
      label: 'Access Restricted',
      title: "You don't have access to this record.",
      explanation: 'Your account can only access projects and evidence that belong to you or have been explicitly shared with you.',
      icon: <Lock className="w-6 h-6 text-[#777777]" />,
      primaryActionLabel: 'Back to Dashboard',
      primaryAction: () => (onGoHome ? onGoHome() : (window.location.href = '/')),
    },
    '429_RATE_LIMITED': {
      label: 'Rate Limit',
      title: "You're moving faster than the service can process.",
      explanation: 'Please wait a few moments before running another automated verification.',
      reassurance: 'No verification attempts were lost.',
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      primaryActionLabel: 'Try Again',
      primaryAction: () => onRetry && onRetry(),
      secondaryActionLabel: 'Dashboard',
      secondaryAction: onGoHome,
    },
    '500_UNEXPECTED': {
      label: 'Verification Interrupted',
      title: 'Something went wrong.',
      explanation: 'The verification operation could not be completed at this moment.',
      reassurance: 'Your project records and attached evidence are safe and unchanged.',
      icon: <AlertCircle className="w-6 h-6 text-[#D9534F]" />,
      primaryActionLabel: 'Try Again',
      primaryAction: () => (onRetry ? onRetry() : window.location.reload()),
      secondaryActionLabel: 'Back to Project',
      secondaryAction: onDismiss || onGoHome,
    },
    '502_UNAVAILABLE': {
      label: 'Service Paused',
      title: 'Chronicle Ledger is temporarily unavailable.',
      explanation: 'The verification engine is experiencing temporary connection delays.',
      reassurance: 'Your project data is not being changed by this failed request.',
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      primaryActionLabel: 'Try Again',
      primaryAction: () => (onRetry ? onRetry() : window.location.reload()),
      secondaryActionLabel: 'Dashboard',
      secondaryAction: onGoHome,
    },
    '504_TIMEOUT': {
      label: 'Operation Timed Out',
      title: 'That verification took longer than expected.',
      explanation: 'The document extraction or evaluation exceeded standard time limits.',
      reassurance: 'Your previously saved verification states are still active.',
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      primaryActionLabel: 'Try Again',
      primaryAction: () => onRetry && onRetry(),
      secondaryActionLabel: 'View Project',
      secondaryAction: onDismiss || onGoHome,
    },
    OFFLINE: {
      label: 'Offline Mode',
      title: "You're offline.",
      explanation: "We couldn't reach Chronicle Ledger. Check your internet connection to continue verifying requirements.",
      reassurance: 'Any local edits will remain in this tab until reconnected.',
      icon: <WifiOff className="w-6 h-6 text-[#666666]" />,
      primaryActionLabel: 'Retry Connection',
      primaryAction: () => (onRetry ? onRetry() : window.location.reload()),
    },
    FILE_UNSUPPORTED: {
      label: 'Unsupported File',
      title: "This file type isn't supported.",
      explanation: 'Chronicle Ledger supports Markdown (.md), PDF (.pdf), plain text (.txt), JSON logs, and CLI execution logs.',
      icon: <FileWarning className="w-6 h-6 text-amber-700" />,
      primaryActionLabel: 'Choose Another File',
      primaryAction: () => onDismiss && onDismiss(),
    },
    FILE_TOO_LARGE: {
      label: 'Payload Limit',
      title: 'This file is too large.',
      explanation: 'Uploaded evidence files must be under 5MB for automated verification and provenance hashing.',
      icon: <FileWarning className="w-6 h-6 text-rose-700" />,
      primaryActionLabel: 'Choose Smaller File',
      primaryAction: () => onDismiss && onDismiss(),
    },
    FILE_CORRUPT: {
      label: 'Unreadable Artifact',
      title: "We couldn't read this file.",
      explanation: 'The file appears incomplete or corrupted. Try re-exporting it from your tool or uploading a text version.',
      icon: <FileWarning className="w-6 h-6 text-rose-700" />,
      primaryActionLabel: 'Try Another File',
      primaryAction: () => onDismiss && onDismiss(),
    },
    EXTRACTION_FAILED: {
      label: 'Extraction Issue',
      title: "We couldn't extract usable information from this file.",
      explanation: 'The document did not contain verifiable text or recognized metrics.',
      reassurance: 'Try uploading a test report, git commit log, or README containing explicit numbers.',
      icon: <FileWarning className="w-6 h-6 text-amber-700" />,
      primaryActionLabel: 'Try Another Document',
      primaryAction: () => onDismiss && onDismiss(),
    },
    VERIFICATION_UNAVAILABLE: {
      label: 'Verification Engine',
      title: "Verification couldn't be completed.",
      explanation: "Chronicle Ledger couldn't extract the value needed for this rule from the supplied evidence.",
      reassurance: 'No verification status was overwritten.',
      icon: <AlertCircle className="w-6 h-6 text-[#111111]" />,
      primaryActionLabel: 'Review Evidence',
      primaryAction: () => (onDismiss ? onDismiss() : onRetry && onRetry()),
      secondaryActionLabel: 'Try Another File',
      secondaryAction: onDismiss,
    },
  };

  const curr = configMap[kind] || configMap['500_UNEXPECTED'];

  return (
    <div className="p-6 sm:p-8 bg-white rounded-2xl border border-[#EEEEEE] shadow-2xs max-w-lg mx-auto w-full text-center space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-center gap-2 text-[#888888]">
        <ChronicleLogo className="w-5 h-5 text-[#111111]" />
        <span className="text-[11px] font-mono uppercase tracking-widest font-semibold">
          {curr.label}
        </span>
      </div>

      <div className="w-12 h-12 rounded-xl bg-[#F8F8F8] border border-[#EEEEEE] flex items-center justify-center mx-auto">
        {curr.icon}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-semibold text-[#111111] tracking-tight">
          {curr.title}
        </h3>
        <p className="text-xs text-[#666666] leading-relaxed max-w-sm mx-auto">
          {curr.explanation}
        </p>
        {curr.reassurance && (
          <p className="text-[11px] text-emerald-800 bg-emerald-50 py-1 px-2.5 rounded-md border border-emerald-100 inline-block font-medium mt-1">
            {curr.reassurance}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
        <button
          onClick={curr.primaryAction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
        >
          {kind.includes('TIMEOUT') || kind.includes('UNAVAILABLE') || kind === 'OFFLINE' || kind.includes('429') ? (
            <RotateCw className="w-3.5 h-3.5" />
          ) : kind === '401_SESSION_REQUIRED' ? (
            <LogIn className="w-3.5 h-3.5" />
          ) : null}
          <span>{curr.primaryActionLabel}</span>
        </button>

        {curr.secondaryActionLabel && curr.secondaryAction && (
          <button
            onClick={curr.secondaryAction}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F5F5F5] text-xs text-[#111111] font-semibold cursor-pointer transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#666666]" />
            <span>{curr.secondaryActionLabel}</span>
          </button>
        )}
      </div>

      {/* Reference & Progressive Technical Disclosure */}
      <div className="pt-4 border-t border-[#F0F0F0] space-y-2">
        <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-[#888888]">
          <span>Reference: <strong className="text-[#111111]">{refCode}</strong></span>
          {technicalDetails && (
            <>
              <span>•</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[#111111] hover:underline flex items-center gap-1 cursor-pointer font-sans font-medium text-xs"
              >
                <span>{showDetails ? 'Hide details' : 'Technical details'}</span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>

        {showDetails && technicalDetails && (
          <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE] text-left text-xs font-mono text-[#444444] space-y-1 animate-in fade-in duration-100">
            <span className="text-[10px] uppercase font-bold text-[#888888] block">Diagnostic Trace</span>
            <p className="text-[11px] text-[#222222] font-mono break-all">
              {technicalDetails}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
