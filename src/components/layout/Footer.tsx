
"use client";
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';

interface FooterProps {
  fullWidth?: boolean;
}

const Footer = ({ fullWidth = false }: FooterProps) => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className={cn(
        "container mx-auto px-4 py-4 text-center text-muted-foreground text-sm",
        !fullWidth && "max-w-md" // Aplicar max-w-md solo si fullWidth es false
      )}>
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
