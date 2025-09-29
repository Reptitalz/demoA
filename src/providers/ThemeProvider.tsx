
"use client";

import type { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps): JSX.Element {
  // Force light theme and disable theme switching
  return <NextThemesProvider {...props} forcedTheme="light">{children}</NextThemesProvider>;
}
