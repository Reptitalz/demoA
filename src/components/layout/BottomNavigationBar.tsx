
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Removed useState and ConsumptionViewDialog import

const BottomNavigationBar = () => {
  const pathname = usePathname();
  // Removed isConsumptionDialogOpen state

  const navItems = [
    { href: '/app/dashboard', label: 'Inicio', icon: Home },
    { href: '/app/consumption', label: 'Consumos', icon: BarChart2 }, // Changed from action to href
  ];

  // Hide on setup page or if not on an /app/ route
  if (pathname === '/app/setup' || !pathname.startsWith('/app/')) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md md:hidden z-[60]">
        <div className="container mx-auto px-2 h-16 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href; // Updated active state logic
            return (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                  "flex flex-col items-center justify-center h-full w-1/2 rounded-none text-xs p-1",
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
      {/* Removed ConsumptionViewDialog instance */}
    </>
  );
};

export default BottomNavigationBar;
