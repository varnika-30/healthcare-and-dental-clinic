import React from "react";

export function ToothIcon({ className = "", size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <ellipse cx="8.5" cy="12.5" rx="1.2" ry="1.8" fill="currentColor" />
      <ellipse cx="15.5" cy="12.5" rx="1.2" ry="1.8" fill="currentColor" />
      <path d="M8 16.2 Q 12 20.2 16 16.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.5 15.7 Q 6 16.2 6.5 15.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18.5 15.7 Q 18 16.2 17.5 15.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
