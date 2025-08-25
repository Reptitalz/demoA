
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
    default: `${APP_NAME} | Asistentes Virtuales IA y Automatización WhatsApp`,
    template: `%s | ${APP_NAME}`,
  },
  description: `Descubre ${APP_NAME}, la plataforma líder para crear y gestionar asistentes virtuales con IA. Automatiza tu comunicación por WhatsApp, integra bases de datos y optimiza procesos.`,
  keywords: [
    // Existing keywords
    'asistente virtual', 
    'IA', 
    'chatbot', 
    'WhatsApp', 
    'automatización', 
    'CRM', 
    'inteligencia artificial', 
    APP_NAME, 
    'gestión de clientes', 
    'Hey Manito', 
    'chatbot para WhatsApp', 
    'automatización para negocios', 
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
    'automatización de mensajes WhatsApp',
    'virtual assistant for small business',
    // New local keywords
    'asistente virtual WhatsApp México',
    'asistente virtual WhatsApp Tepic',
    'asistente inteligente WhatsApp Nayarit',
    // New voice-search oriented keywords
    'cómo funciona un asistente virtual en WhatsApp',
    'asistente inteligente para WhatsApp qué hace'
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,

  manifest: '/manifest.json',

  openGraph: {
    title: `${APP_NAME} | Asistentes IA Avanzados`,
    description: `Potencia tu negocio con ${APP_NAME}. Crea asistentes virtuales inteligentes para WhatsApp, gestiona datos y automatiza tareas.`,
    url: BASE_URL,
    siteName: APP_NAME,
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
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
    creator: '@heymanito',
    images: [`${BASE_URL}/icon-512x512.png`],
  },

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
        <link rel="manifest" href="/manifest.json" />
        <script src="https://sdk.mercadopago.com/js/v2"></script>
        
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
