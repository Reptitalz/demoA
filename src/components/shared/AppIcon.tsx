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
      <path d="M15 80 C 5 80, 5 65, 5 55 S 20 10, 50 10 s 45 15, 45 45 s -5 25, -15 25 h -15 l -15 10 z" />
      
      {/* Waving Hand */}
      <path d="M65,60 V40 C65,35 60,30 55,30 H45" />
      <path d="M45,30 C40,30 35,35 35,40 V60" />
      <path d="M35,48 l-5,5" />
      <path d="M65,48 l5,5" />
      <path d="M35,40 l-5,-5" />
      <path d="M65,40 l5,-5" />
    </svg>
  );
};

export default AppIcon;
