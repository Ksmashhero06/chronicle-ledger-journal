import React from 'react';

interface ChronicleLogoProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
}

export const ChronicleLogo: React.FC<ChronicleLogoProps> = ({
  className = '',
  size = 32,
  showBadge = true,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      aria-label="Chronicle Ledger Modern Monogram Logo"
    >
      <defs>
        {/* Background Gradients: Deep Obsidian Black */}
        <linearGradient id="cl-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0F17" />
          <stop offset="50%" stopColor="#060911" />
          <stop offset="100%" stopColor="#020408" />
        </linearGradient>

        <linearGradient id="cl-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#64748B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.15" />
        </linearGradient>

        {/* Metallic Platinum Gray Gradient */}
        <linearGradient id="cl-platinum-c" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#F1F5F9" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="cl-platinum-l" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="45%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        {/* Vibrant Electric Teal for Upward Diagonal Notch */}
        <linearGradient id="cl-teal-glow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="40%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>

        {/* Subtle Radial Glow */}
        <radialGradient id="cl-radial-glow" cx="65%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>

        <filter id="cl-notch-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {showBadge && (
        <>
          {/* Deep Obsidian Black Squircle */}
          <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#cl-bg-grad)" />
          <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#cl-radial-glow)" />
          <rect
            x="6.75"
            y="6.75"
            width="114.5"
            height="114.5"
            rx="27.25"
            stroke="url(#cl-border-grad)"
            strokeWidth="1.5"
          />
        </>
      )}

      {/* Monogram Interlocking "C" and "L" */}
      <g transform={showBadge ? 'translate(6, 4)' : 'translate(0, 0)'}>
        {/* The 'C' Form: Sweeping gracefully into the horizontal base */}
        <path
          d="M 80 38 
             C 80 26, 68 18, 52 18 
             C 32 18, 20 32, 20 58 
             C 20 82, 34 96, 56 96 
             C 72 96, 85 86, 90 75
             L 79 69
             C 75 77, 67 84, 56 84
             C 40 84, 32 72, 32 58
             C 32 40, 41 30, 52 30
             C 63 30, 69 35, 70 38
             Z"
          fill="url(#cl-platinum-c)"
        />

        {/* The 'L' Form: Interlocking through C into continuous horizontal base */}
        <path
          d="M 52 24
             L 64 24
             L 64 74
             C 64 78, 68 84, 76 84
             L 96 84
             L 96 96
             L 72 96
             C 58 96, 52 86, 52 74
             Z"
          fill="url(#cl-platinum-l)"
        />

        {/* Upward Diagonal Notch: Forward trajectory and growth symbol */}
        <path
          d="M 64 54
             L 86 32
             L 74 32
             L 74 24
             L 98 24
             L 98 48
             L 90 48
             L 90 36
             L 68 58
             Z"
          fill="url(#cl-teal-glow)"
          filter="url(#cl-notch-glow)"
        />

        {/* Dynamic Precision Point */}
        <circle cx="64" cy="54" r="3" fill="#22D3EE" />
      </g>
    </svg>
  );
};
