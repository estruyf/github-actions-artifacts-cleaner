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
      <a
        href="https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fgithub-actions-artifacts-cleaner"
        target="_blank"
        rel="noreferrer"
        title="Visitor Count">
        <img
          src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fgithub-actions-artifacts-cleaner&countColor=%230056a4&labelColor=%230056a4&style=plastic"
          alt="Visitor Count"
          className="h-5"
        />
      </a>
    </div>
  );
}