/**
 * Visitor tracking component using visitorbadge.io
 * Displays a visitor count badge for the website
 */
import React from 'react';

interface VisitorBadgeProps {
  className?: string;
}

export function VisitorBadge({ className = "" }: VisitorBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="https://visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub-actions-storage-dashboard.vercel.app&countColor=%2300d4aa&style=flat"
        alt="Visitor Count"
        className="h-5"
      />
      <span className="text-xs text-muted-foreground">visitors</span>
    </div>
  );
}