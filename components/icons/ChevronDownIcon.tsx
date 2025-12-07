import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function ChevronDownIcon({ className = "", size }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      strokeWidth="2"
    >
      <path
        fillRule="evenodd"
        d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22v8.69A.75.75 0 0 1 8 14Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
