"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Icon from '@/public/icon.svg';

const AppIcon = ({ className, ...props }: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => (
    <Image 
        src={Icon} 
        alt="App Icon"
        className={cn('h-auto w-full', className)} 
        {...props} 
    />
);

export default AppIcon;
