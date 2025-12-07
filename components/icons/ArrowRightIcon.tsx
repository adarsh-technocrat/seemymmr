import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function ArrowRightIcon({ className = "", size }: IconProps) {
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
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}
