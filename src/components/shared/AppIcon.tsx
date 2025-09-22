"use client";

import { cn } from '@/lib/utils';
import Icon from '@/public/icon.svg';

const AppIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <Icon className={cn('h-auto w-full', className)} {...props} />
);

export default AppIcon;
