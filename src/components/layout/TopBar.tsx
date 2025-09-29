// src/components/layout/TopBar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaUserCircle } from 'react-icons/fa';
import { Button } from '../ui/button';

const FlagMX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="h-4 w-4">
    <path fill="#006847" d="M0 0h1v2H0z"/>
    <path fill="#fff" d="M1 0h1v2H1z"/>
    <path fill="#ce1126" d="M2 0h1v2H2z"/>
  </svg>
);

const FlagUS = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 400" className="h-4 w-4">
    <path fill="#b22234" d="M0 0h780v400H0z"/>
    <path fill="#fff" d="M0 40h780v40H0zm0 80h780v40H0zm0 80h780v40H0zm0 80h780v40H0zM0 320h780v40H0z"/>
    <path fill="#3c3b6e" d="M0 0h312v200H0z"/>
  </svg>
);


interface TopBarProps {
  fullWidth?: boolean;
}

const TopBar = ({ fullWidth = false }: TopBarProps) => {
  return (
    <div className="bg-muted text-muted-foreground text-xs border-b">
      <div className={cn(
        "container mx-auto px-4 py-1 flex items-center justify-between",
        !fullWidth && "max-w-7xl"
      )}>
        <div className="flex items-center gap-4">
           <Link href="/access" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <FaUserCircle />
            <span>Acceder</span>
          </Link>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <FlagMX />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <div className="flex items-center gap-2">
                  <FlagMX />
                  <span>Español (MXN)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <div className="flex items-center gap-2">
                  <FlagUS />
                  <span>English (USD)</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
