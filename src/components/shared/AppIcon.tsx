
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn(className)} {...props}>
        <path d="M3 12a9 9 0 0115.9-5.9L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 16v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default AppIcon;
