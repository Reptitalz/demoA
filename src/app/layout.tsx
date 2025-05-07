
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a more modern feel
import './globals.css';
import { AppProvider } from '@/providers/AppProvider';
import AppLayout from '@/components/layout/AppLayout';
import { APP_NAME } from '@/config/appConfig';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', // if you want to use it as a CSS variable
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Manage your AI powered virtual assistants.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark"> {/* Enforce dark mode at html level */}
      <body className={`${inter.className} antialiased`}>
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AppProvider>
      </body>
    </html>
  );
}
