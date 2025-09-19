import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    <svg 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(className)}
        {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:1}} />
        </linearGradient>
      </defs>
      <path d="M3 12a9 9 0 0115.9-5.9L21 8" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M21 16v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};

export default AppIcon;
