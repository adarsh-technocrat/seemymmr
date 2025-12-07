import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function LiveDemoIcon({ className = "", size }: IconProps) {
  return (
    <svg
      className={className}
      width={size || 32}
      height={size || 32}
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M16 2L2 9l14 7 14-7-14-7zm0 18l-14-7v10l14 7 14-7V13l-14 7z" />
    </svg>
  );
}
