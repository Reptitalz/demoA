"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ComponentProps } from 'react';

// Using Omit to exclude props that will be explicitly set.
// This provides better type safety than just accepting SVGProps.
type AppIconProps = Omit<ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'> & {
    className?: string;
    width?: number;
    height?: number;
};

const AppIcon = ({ className, width = 100, height = 100, ...props }: AppIconProps) => (
    <Image 
        src="/icon.svg"
        alt="Hey Manito App Icon"
        width={width}
        height={height}
        className={cn('h-auto w-full', className)}
        // The unoptimized prop is not needed for local static assets like this.
        {...props}
    />
);

export default AppIcon;
