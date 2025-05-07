
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <main className={cn("flex-grow container mx-auto px-4 py-6 sm:py-8 max-w-md w-full", className)}>
      {children}
    </main>
  );
};

export default PageContainer;
