"use client";

import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

const AppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('h-auto w-full', className)}
        {...props}
    >
        <path
            d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0Z"
            fill="url(#paint0_linear_1_2)"
        />
        <path
            d="M39.63 70.08L39.52 32.55C39.52 30.56 40.85 29.58 42.41 30.34L73.18 45.4C74.65 46.12 74.62 47.38 73.14 48.07L42.52 69.46C40.88 70.28 39.63 69.24 39.63 70.08Z"
            fill="white"
        />
        <defs>
            <linearGradient
                id="paint0_linear_1_2"
                x1="0"
                y1="0"
                x2="100"
                y2="100"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor="#8A2BE2" />
                <stop offset="1" stopColor="#FF1493" />
            </linearGradient>
        </defs>
    </svg>
);

export default AppIcon;
