
"use client";
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // Import Link

interface FooterProps {
  fullWidth?: boolean;
}

const Footer = ({ fullWidth = false }: FooterProps) => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className={cn(
        "container mx-auto px-4 py-4 text-center text-muted-foreground text-xs sm:text-sm", // Adjusted text size for responsiveness
        !fullWidth && "max-w-md" 
      )}>
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
        <p className="mt-1">
          <Link href="/privacy" className="hover:text-primary hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;

    