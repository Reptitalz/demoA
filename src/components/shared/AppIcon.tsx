// src/components/shared/AppIcon.tsx
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * IMPORTANT: This component contains a PLACEHOLDER SVG.
 * Please replace the <svg>...</svg> content below with the
 * actual content of your public/icon.svg file.
 *
 * For the colors to be controlled by CSS (e.g., text-foreground, text-brand-gradient),
 * ensure that any 'fill' or 'stroke' attributes within your SVG paths
 * are set to 'currentColor' or removed entirely.
 */
const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    // Replace the SVG below with your actual icon.svg content
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" // Adjust viewBox if necessary
      fill="currentColor" // This allows CSS to control the fill color via text color utilities
      className={cn(className)}
      {...props}
    >
      {/* START OF PLACEHOLDER SVG - REPLACE THIS PART */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      {/* END OF PLACEHOLDER SVG */}
    </svg>
  );
};

export default AppIcon;
