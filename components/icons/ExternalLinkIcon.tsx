import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function ExternalLinkIcon({ className = "", size }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0 0 14 12.25v-3.5a.75.75 0 0 0-1.5 0v3.5a.25.25 0 0 1-.25.25h-8.5a.25.25 0 0 1-.25-.25v-8.5a.25.25 0 0 1 .25-.25h3.5a.75.75 0 0 0 0-1.5h-3.5Z"></path>
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0V4.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"></path>
    </svg>
  );
}
