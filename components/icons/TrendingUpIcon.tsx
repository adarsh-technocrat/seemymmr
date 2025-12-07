import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function TrendingUpIcon({ className = "", size }: IconProps) {
  return (
    <svg
      className={className}
      width={size || 24}
      height={size || 24}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}
