import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

const AppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-full h-full", className)}
      fill="currentColor"
      {...props}
    >
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M32.8,20.4l-4.3,4.3 M40,24.8l-4.3-4.3 M32.8,29.1l4.3-4.3"
        />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M62.3,31.2c-5.8,0-10.5,4.7-10.5,10.5s4.7,10.5,10.5,10.5c5.6,0,10.2-4.4,10.5-9.9l0,0l0,0v-0.2 c0-0.1,0-0.2,0-0.3c0-0.9-0.1-1.8-0.4-2.6l-10.1,10.1"
        />
        <circle cx="62.3" cy="41.7" r="1.8" />
        <circle cx="56.9" cy="41.7" r="1.8" />
        <circle cx="67.8" cy="41.7" r="1.8" />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M48.2,34.4c-2.8-1.5-5-4.2-5.9-7.4c-0.2-0.8-0.3-1.6-0.3-2.5c0-5.8,4.7-10.5,10.5-10.5 c3.7,0,7,1.9,8.9,4.9"
        />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M50.3,55.9c-0.8,0-1.5-0.1-2.2-0.2c-5-0.9-8.9-5.1-8.9-10.3c0-1.5,0.3-2.9,0.9-4.2c1.9-4,5.9-6.9,10.5-7.3 c0.6,0,1.1-0.1,1.7-0.1c3,0,5.7,0.9,8.1,2.5"
        />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M50.3,55.9c-0.8,0-1.5-0.1-2.2-0.2c-0.8-0.2-1.6-0.4-2.4-0.7c-3.1-1.1-5.6-3.4-7.1-6.4 c-0.6-1.1-1-2.4-1.2-3.7"
        />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M37.3,73.1c-1.5,0-3-0.3-4.3-0.8c-7.3-2.7-11.4-10.8-8.7-18.1c0.1-0.3,0.2-0.6,0.3-0.9 c1.2-3.2,3.7-5.8,6.8-7.1c0.8-0.3,1.6-0.5,2.4-0.7"
        />
        <path
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M37.3,73.1c-0.6,0-1.2-0.1-1.8-0.2c-4-0.9-7.3-3.6-8.9-7.4c-0.7-1.6-1.1-3.3-1.1-5.1c0-6,4.6-11,10.5-11.5"
        />
    </svg>
  );
};

export default AppIcon;
