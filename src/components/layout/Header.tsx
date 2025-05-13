"use client";
import Link from 'next/link';
import { FaRobot } from 'react-icons/fa';
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const Header = () => {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-md">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <FaRobot size={28} />
          <h1 className="text-xl font-bold text-foreground">{APP_NAME}</h1>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
