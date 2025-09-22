"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

const AppIcon = ({ className, ...props }: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src="/icon.svg" 
        alt="App Icon"
        width={50}
        height={50}
        className={cn('h-auto w-full', className)} 
        {...props} 
    />
);

export default AppIcon;
