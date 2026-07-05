import React from "react";

export function ToothIcon({ className = "", size, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const width = size || "100%";
  const height = size || "100%";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={width}
      height={height}
      className={className}
      {...props}
    >
      {/* Teal rounded-square/squircle background matching primary brand teal color */}
      <rect x="0" y="0" width="100" height="100" rx="28" ry="28" fill="var(--color-primary, oklch(0.66 0.11 185))" />
      {/* Eyes */}
      <circle cx="31" cy="38" r="6.5" fill="#ffffff" />
      <circle cx="69" cy="38" r="6.5" fill="#ffffff" />
      {/* Smile */}
      <path
        d="M 28 63 Q 50 84 72 63"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
