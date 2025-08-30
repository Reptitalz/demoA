
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a more modern feel
import '@/app/globals.css';
import { AppProvider } from '@/providers/AppProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import AppLayout from '@/components/layout/AppLayout';
import { APP_NAME } from '@/config/appConfig';
import Script from 'next/script';
import NextAuthSessionProvider from '@/providers/SessionProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// Use a simple and robust way to determine the base URL.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${APP_NAME} | Asistentes Virtuales IA y Automatizaci\u00f3n WhatsApp`,
    template: `%s | ${APP_NAME}`,
  },
  description: `Descubre ${APP_NAME}, la plataforma l\u00edder para crear y gestionar asistentes virtuales con IA. Automatiza tu comunicaci\u00f3n por WhatsApp, integra bases de datos y optimiza procesos.`,
  keywords: [
    // Existing keywords
    'asistente virtual', 
    'IA', 
    'chatbot', 
    'WhatsApp', 
    'automatizaci\u00f3n', 
    'CRM', 
    'inteligencia artificial', 
    APP_NAME, 
    'gesti\u00f3n de clientes', 
    'Hey Manito', 
    'chatbot para WhatsApp', 
    'automatizaci\u00f3n para negocios', 
    'CRM con IA',
    // New high-volume keywords
    'virtual assistant',
    'ai assistant',
    'digital assistant',
    'va assistant',
    // New WhatsApp specific keywords
    'WhatsApp virtual assistant',
    'AI assistant for WhatsApp',
    'Asistente inteligente WhatsApp para negocios',
    // New long-tail commercial keywords
    'WhatsApp assistant for customer support',
    'WhatsApp AI assistant pricing',
    'automatizaci\u00f3n de mensajes WhatsApp',
    'virtual assistant for small business',
    // New local keywords
    'asistente virtual WhatsApp M\u00e9xico',
    'asistente virtual WhatsApp Tepic',
    'asistente inteligente WhatsApp Nayarit',
    // New voice-search oriented keywords
    'c\u00f3mo funciona un asistente virtual en WhatsApp',
    'asistente inteligente para WhatsApp qu\u00e9 hace'
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8a4fff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        
        {/* Google Analytics Script */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B92V0NVLCC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B92V0NVLCC');
          `}
        </Script>
      </head>
      <body className={`${inter.className} antialiased`}>
        <NextAuthSessionProvider>
            <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
            >
            <AppProvider>
                <AppLayout>
                {children}
                </AppLayout>
            </AppProvider>
            </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
