"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';

const AppIcon = ({ className, ...props }: React.ComponentProps<typeof Image>) => (
    <Image
        src="/icon.svg"
        alt="Hey Manito App Icon"
        width={props.width || 48}
        height={props.height || 48}
        className={cn(className)}
        {...props}
        unoptimized // Necessary for SVGs in Next.js Image component if not using a loader
    />
);

export default AppIcon;
