"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

const AppIcon = ({ className, ...props }: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src="/heymanito.svg"
        alt="Hey Manito Icon"
        width={100}
        height={100}
        className={cn('h-auto w-full', className)}
        unoptimized
        {...props}
    />
);

export default AppIcon;
