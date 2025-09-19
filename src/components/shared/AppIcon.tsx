
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    <svg
      viewBox="0 0 768 768"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <path fill="#000" d="M223.8 190c-16 0-29 13-29 29v330c0 16 13 29 29 29h320c16 0 29-13 29-29V219c0-16-13-29-29-29H223.8z"/>
      <path fill="#f8f8f5" d="M287 560c-36 0-65-29-65-65V273c0-36 29-65 65-65h194c36 0 65 29 65 65v222c0 36-29 65-65 65H287z"/>
      <path fill="#000" d="M340 390c0 20-16 36-36 36s-36-16-36-36 16-36 36-36 36 16 36 36zm96 0c0 20-16 36-36 36s-36-16-36-36 16-36 36-36 36 16 36 36z"/>
      <path fill="#000" d="M276 495h216v30H276z"/>
    </svg>
  );
};

export default AppIcon;
