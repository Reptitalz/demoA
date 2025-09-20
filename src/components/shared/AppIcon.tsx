
import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

const AppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-full h-full", className)}
      {...props}
    >
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2" />
        <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7h0A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 14.5 2" />
        <path d="M12 14.5a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-5 0v0a2.5 2.5 0 0 0 2.5 2.5" />
        <path d="M9.5 22a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-5 0v0a2.5 2.5 0 0 0 2.5 2.5" />
        <path d="M14.5 22a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-5 0v0a2.5 2.5 0 0 0 2.5 2.5" />
        <path d="M17 14.5a2.5 2.5 0 0 1 2.5-2.5v0a2.5 2.5 0 0 1-5 0v0a2.5 2.5 0 0 1 2.5 2.5" />
        <path d="M7 14.5a2.5 2.5 0 0 0 2.5-2.5v0a2.5 2.5 0 0 0-5 0v0a2.5 2.5 0 0 0 2.5 2.5" />
        <path d="M12 7v5" />
        <path d="M9.5 7v5" />
        <path d="M14.5 7v5" />
        <path d="M7 12h10" />
        <path d="M9.5 19.5v-5" />
        <path d="M14.5 19.5v-5" />
    </svg>
  );
};

export default AppIcon;
