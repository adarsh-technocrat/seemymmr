import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function CopyIcon({ className = "", size }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
    >
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V8.621a3 3 0 0 0-.879-2.121L9.12 4.379A3 3 0 0 0 7 3.5H5.5Z"></path>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h1.085a1.5 1.5 0 0 1 1.06.44l1.915 1.914A1.5 1.5 0 0 1 9.085 8H4.5A1.5 1.5 0 0 1 3 6.5v-1Z"></path>
    </svg>
  );
}
