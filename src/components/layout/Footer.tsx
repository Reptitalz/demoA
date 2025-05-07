
"use client";
import { APP_NAME } from '@/config/appConfig';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-muted-foreground text-sm max-w-md">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
