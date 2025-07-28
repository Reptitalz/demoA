
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a more modern feel
import '@/app/globals.css';
import { AppProvider } from '@/providers/AppProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import AppLayout from '@/components/layout/AppLayout';
import { APP_NAME } from '@/config/appConfig';
import Script from 'next/script';
import { Suspense } from 'react';
import { FirebaseAnalyticsProvider } from '@/lib/firebaseAnalytics';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

// Use a simple and robust way to determine the base URL.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${APP_NAME} | Asistentes Virtuales IA y Automatización WhatsApp`,
    template: `%s | ${APP_NAME}`,
  },
  description: `Descubre ${APP_NAME}, la plataforma líder para crear y gestionar asistentes virtuales con IA. Automatiza tu comunicación por WhatsApp, integra bases de datos y optimiza procesos.`,
  keywords: ['asistente virtual', 'IA', 'chatbot', 'WhatsApp', 'automatización', 'CRM', 'inteligencia artificial', APP_NAME, 'gestión de clientes', 'Hey Manito'],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,

  openGraph: {
    title: `${APP_NAME} | Asistentes IA Avanzados`,
    description: `Potencia tu negocio con ${APP_NAME}. Crea asistentes virtuales inteligentes para WhatsApp, gestiona datos y automatiza tareas.`,
    url: BASE_URL,
    siteName: APP_NAME,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: `Plataforma ${APP_NAME} para asistentes virtuales con IA`,
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Transforma tu Comunicación con IA`,
    description: `Configura asistentes virtuales en minutos con ${APP_NAME}. Integración WhatsApp, bases de datos inteligentes y más.`,
    creator: '@TuUsuarioTwitter',
    images: [`${BASE_URL}/twitter-image.png`],
  },

  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <Script src="https://sdk.mercadopago.com/js/v2" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <FirebaseAnalyticsProvider>
                <AppLayout>
                  {children}
                </AppLayout>
            </FirebaseAnalyticsProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
