
"use client";
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FooterProps {
  fullWidth?: boolean;
}

const Footer = ({ fullWidth = false }: FooterProps) => {
  return (
    <footer className="relative z-20 max-w-6xl mx-auto px-6 py-12 text-muted-foreground w-full" id="contact">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-bold text-foreground">{APP_NAME}</p>
              <p className="text-sm">PWA · Soporta asistentes inteligentes · Gestión de ventas</p>
            </div>
            <div className="text-sm">
              <p>Correo: contacto@heymanito.com</p>
              <p className="mt-1">© {new Date().getFullYear()} {APP_NAME}</p>
            </div>
          </div>
    </footer>
  );
};

export default Footer;
