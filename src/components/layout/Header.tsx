
"use client";
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className={cn(
        "container mx-auto px-4 py-3 flex items-center justify-between",
        !fullWidth && "max-w-md" // Aplicar max-w-md solo si fullWidth es false
      )}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* Replace FaRobot with Image component */}
          <Image 
            src="/icon.svg" 
            alt={`${APP_NAME} Icon`} 
            width={28} 
            height={28} 
            className="h-7 w-7" // Ensure size matches previous icon
          />
          <h1 className="text-xl font-bold text-brand-gradient">{APP_NAME}</h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
