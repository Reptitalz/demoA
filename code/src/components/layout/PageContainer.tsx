
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean; // Nueva propiedad para controlar el ancho
}

const PageContainer = ({ children, className, fullWidth = false }: PageContainerProps) => {
  return (
    <main className={cn(
      "flex-grow container mx-auto px-4 py-6 sm:py-8 w-full",
      !fullWidth && "max-w-7xl", // Apply max-w-7xl unless fullWidth is true
      className
    )}>
      {children}
    </main>
  );
};

export default PageContainer;
