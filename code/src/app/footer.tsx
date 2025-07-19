
"use client";
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FooterProps {
  fullWidth?: boolean;
}

const Footer = ({ fullWidth = false }: FooterProps) => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className={cn(
        "container mx-auto px-4 py-4 text-center text-muted-foreground text-xs sm:text-sm",
        !fullWidth && "max-w-7xl" 
      )}>
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-4 mt-1">
          <Link href="/privacy" className="hover:text-primary hover:underline">
            Política de Privacidad
          </Link>
          <Link href="/terms" className="hover:text-primary hover:underline">
            Términos y Condiciones
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
