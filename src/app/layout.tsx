
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
    // Keywords en español
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
    'asistente inteligente WhatsApp para negocios',
    'automatizaci\u00f3n de mensajes WhatsApp',
    'asistente virtual WhatsApp M\u00e9xico',
    'asistente virtual para pymes',
    'crear chatbot para WhatsApp',
    'software de asistente virtual',
    'plataforma de IA conversacional',
    'agente virtual para atenci\u00f3n al cliente',
    'automatizar WhatsApp Business',
    'crear asistente inteligente',
    'generador de chatbot',
    'asistente de ia para negocios',
    'crear chatbot con ia',
    'ia para whatsapp',
    'automatización con inteligencia artificial',
    'generador de asistentes virtuales',
    'chatbot desde prompt',

    // Keywords en inglés
    'virtual assistant',
    'AI assistant',
    'digital assistant',
    'chatbot for WhatsApp',
    'WhatsApp automation',
    'AI for customer service',
    'conversational AI platform',
    'virtual agent software',
    'intelligent assistant',
    'AI chatbot builder',
    'prompt-based AI generator',
    
    // Keywords de cola larga (long-tail)
    'c\u00f3mo crear un asistente virtual para mi negocio',
    'mejor plataforma para chatbots de WhatsApp',
    'precio de asistente virtual para WhatsApp',
    'automatizaci\u00f3n de ventas por WhatsApp',
    'software para atenci\u00f3n al cliente con IA',
    'virtual assistant for small business',
    'how to build a WhatsApp chatbot',
    
    // Keywords locales
    'asistente virtual en Guadalajara',
    'automatizaci\u00f3n de WhatsApp en Monterrey',
    'chatbot para negocios en CDMX',
    'asistente virtual WhatsApp Tepic',
    'asistente inteligente WhatsApp Nayarit',
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

        {/* Google AdSense Script - Reemplaza ca-pub-XXXXXXXXXXXXXXXX con tu ID de editor */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
