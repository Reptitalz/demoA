import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

const AppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        {/* Chat bubble */}
        <path d="M20 80C10 80 10 65 10 55C10 30 25 15 50 15C75 15 90 30 90 55C90 70 85 80 75 80L65 80L50 90L35 80L20 80Z" />

        {/* Hand */}
        <path d="M35 65V45C35 40 40 35 45 35H55" />
        <path d="M55 35L65 45" />
        <path d="M55 35L65 25" />

        {/* Snap lines */}
        <path d="M70 20L75 25" />
        <path d="M70 50L75 45" />
    </svg>
  );
};

export default AppIcon;
