
import type { ReactNode } from 'react';

// El AppLayout, ThemeProvider y AppProvider ya están aplicados por el layout raíz (src/app/layout.tsx)
// Este layout es para la agrupación de rutas bajo /app.
export default function AppPagesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
