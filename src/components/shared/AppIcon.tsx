"use client";

import { cn } from '@/lib/utils';
import type { SVGProps } from 'react';

const AppIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('h-auto w-full', className)}
        {...props}
    >
        <defs>
            <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="url(#iconGradient)"></path>
        <path d="M2 17l10 5 10-5" stroke="url(#iconGradient)"></path>
        <path d="M2 12l10 5 10-5" stroke="url(#iconGradient)"></path>
    </svg>
);

export default AppIcon;
