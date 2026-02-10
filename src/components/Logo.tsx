'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  /** Show text label next to icon */
  showLabel?: boolean;
  className?: string;
}

export function Logo({ showLabel = true, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className ?? ''}`}
    >
      <div className="bg-primary p-1.5 rounded-lg">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </div>
      {showLabel && (
        <span className="font-semibold text-sm text-foreground hidden sm:inline">
          IELTS Practice
        </span>
      )}
    </Link>
  );
}
