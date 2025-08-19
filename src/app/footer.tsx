"use client";
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FaFacebook } from 'react-icons/fa';

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
        <div className="flex justify-center items-center gap-4 mb-2">
            <a href="https://www.facebook.com/share/1MF3DaQi6M/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <FaFacebook size={20} />
            </a>
        </div>
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
