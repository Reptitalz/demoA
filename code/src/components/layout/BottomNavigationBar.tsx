
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const BottomNavigationBar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
  ];

  const isAppArea = pathname.startsWith('/app/') || pathname.startsWith('/dashboard');

  if (pathname === '/app/setup' || !isAppArea) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md md:hidden z-[60]">
        <div className="container mx-auto px-2 h-16 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                  "flex flex-col items-center justify-center h-full w-full rounded-none text-xs p-1",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <Link href={item.href} className="flex flex-col items-center">
                  <item.icon className={cn("h-5 w-5 mb-0.5", isActive && "text-primary")} />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavigationBar;
