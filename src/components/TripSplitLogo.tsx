import React from "react";
import { motion } from "motion/react";

interface TripSplitLogoProps {
  className?: string;
  size?: number;
}

export function TripSplitLogo({ className = "", size = 48 }: TripSplitLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Brand Gradients */}
          <linearGradient id="logoGradPrimary" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" /> {/* Blue 500 */}
            <stop offset="100%" stopColor="#6366f1" /> {/* Indigo 500 */}
          </linearGradient>
          <linearGradient id="logoGradSecondary" x1="100" y1="20" x2="20" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan 500 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
          </linearGradient>
          <linearGradient id="logoTrailGrad" x1="30" y1="90" x2="90" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Glossy Overlay */}
          <linearGradient id="logoGloss" x1="60" y1="15" x2="60" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Dynamic Curved Split Paths (Behind) */}
        <path
          d="M 25 105 Q 40 75 75 60 T 105 15"
          stroke="url(#logoTrailGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <path
          d="M 15 95 Q 35 65 60 55 T 95 25"
          stroke="url(#logoTrailGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />

        {/* Base Layer: Left Wing of the Split (Deep Indigo / Blue) */}
        <path
          d="M 60 20 L 25 85 L 60 70 Z"
          fill="url(#logoGradPrimary)"
          filter="url(#logoShadow)"
        />

        {/* Right Wing of the Split (Vibrant Cyan / Blue) */}
        <path
          d="M 60 20 L 60 70 L 95 85 Z"
          fill="url(#logoGradSecondary)"
          filter="url(#logoShadow)"
        />

        {/* Top/Front Crease Cover (Simulating folding) */}
        <path
          d="M 60 20 L 45 60 L 60 70 L 75 60 Z"
          fill="url(#logoGloss)"
          opacity="0.9"
        />

        {/* Center Split Core Divider (The actual split gap) */}
        <line
          x1="60"
          y1="20"
          x2="60"
          y2="70"
          stroke="#f8fafc"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Decorative Compass Dot (Travel theme) */}
        <circle cx="60" cy="12" r="3" fill="#6366f1" className="animate-ping" style={{ transformOrigin: '60px 12px' }} />
        <circle cx="60" cy="12" r="2.5" fill="#3b82f6" />
      </svg>
    </div>
  );
}
