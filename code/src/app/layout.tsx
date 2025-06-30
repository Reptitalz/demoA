
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a more modern feel
import './globals.css';
import { AppProvider } from '@/providers/AppProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import AppLayout from '@/components/layout/AppLayout';
import { APP_NAME } from '@/config/appConfig';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

let determinedBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const defaultFallbackUrl = 'https://www.tu-dominio.com'; // CAMBIA ESTO a tu dominio real

if (!determinedBaseUrl || typeof determinedBaseUrl !== 'string' || determinedBaseUrl.trim() === '') {
  console.warn(
    `NEXT_PUBLIC_BASE_URL is not set or is empty. Falling back to default: ${defaultFallbackUrl}`
  );
  determinedBaseUrl = defaultFallbackUrl;
} else {
  try {
    determinedBaseUrl = determinedBaseUrl.trim();
    if (!determinedBaseUrl.startsWith('http://') && !determinedBaseUrl.startsWith('https://')) {
      if (determinedBaseUrl.includes('.') && !determinedBaseUrl.startsWith('localhost')) {
        // Looks like a domain (e.g., example.com) but no scheme
        console.warn(`NEXT_PUBLIC_BASE_URL "${determinedBaseUrl}" seems to be missing a scheme. Assuming https.`);
        determinedBaseUrl = `https://${determinedBaseUrl}`;
      } else if (determinedBaseUrl.startsWith('localhost')) {
        // For localhost (e.g., localhost:3000, localhost:9002)
        console.warn(`NEXT_PUBLIC_BASE_URL "${determinedBaseUrl}" is localhost and missing a scheme. Assuming http.`);
        determinedBaseUrl = `http://${determinedBaseUrl}`;
      } else {
        // Not clearly a domain and not localhost (e.g., just a path or gibberish)
        throw new Error('URL scheme is missing and cannot be reliably inferred.');
      }
    }
    new URL(determinedBaseUrl); // Validate the (potentially prefixed) URL
  } catch (e) {
    console.error(
      `Invalid NEXT_PUBLIC_BASE_URL: "${process.env.NEXT_PUBLIC_BASE_URL}". Error: ${(e as Error).message}. Falling back to default: ${defaultFallbackUrl}`
    );
    determinedBaseUrl = defaultFallbackUrl;
  }
}

const BASE_URL = determinedBaseUrl;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL), // Base para URLs relativas en metadatos
  title: {
    default: `${APP_NAME} | Asistentes Virtuales IA y Automatización WhatsApp`,
    template: `%s | ${APP_NAME}`, // Permite títulos de página específicos
  },
  description: `Descubre ${APP_NAME}, la plataforma líder para crear y gestionar asistentes virtuales con IA. Automatiza tu comunicación por WhatsApp, integra bases de datos y optimiza procesos.`,
  keywords: ['asistente virtual', 'IA', 'chatbot', 'WhatsApp', 'automatización', 'CRM', 'inteligencia artificial', APP_NAME, 'gestión de clientes', 'Hey Manito'],
  authors: [{ name: APP_NAME /* O el nombre de tu empresa */ }],
  creator: APP_NAME,
  publisher: APP_NAME,

  // Open Graph (para Facebook, LinkedIn, etc.)
  openGraph: {
    title: `${APP_NAME} | Asistentes IA Avanzados`,
    description: `Potencia tu negocio con ${APP_NAME}. Crea asistentes virtuales inteligentes para WhatsApp, gestiona datos y automatiza tareas.`,
    url: BASE_URL,
    siteName: APP_NAME,
    images: [
      {
        url: '/opengraph-image.png', // DEBES CREAR ESTA IMAGEN: public/opengraph-image.png (1200x630px recomendado)
        width: 1200,
        height: 630,
        alt: `Plataforma ${APP_NAME} para asistentes virtuales con IA`,
      },
    ],
    locale: 'es_MX', // Ajusta a tu localidad principal (ej. es_ES, es_AR)
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Transforma tu Comunicación con IA`,
    description: `Configura asistentes virtuales en minutos con ${APP_NAME}. Integración WhatsApp, bases de datos inteligentes y más.`,
    // siteId: 'TuTwitterSiteID', // Opcional: ID numérico de tu sitio en Twitter
    creator: '@TuUsuarioTwitter', // Opcional: Tu usuario de Twitter (ej. @HeyManitoApp)
    // creatorId: 'TuTwitterCreatorID', // Opcional
    images: [`${BASE_URL}/twitter-image.png`], // DEBES CREAR ESTA IMAGEN: public/twitter-image.png (1200x600px o similar)
  },

  // Íconos
  icons: {
    icon: '/icon.svg', // Ya existente
    shortcut: '/icon.svg',
    apple: '/apple-icon.png', // DEBES CREAR ESTA IMAGEN: public/apple-icon.png (ej. 180x180px)
  },

  // Robots (complementa robots.txt para directivas específicas)
  robots: {
    index: true, // Permitir indexación por defecto
    follow: true, // Permitir seguir enlaces por defecto
    googleBot: { // Directivas específicas para GoogleBot
      index: true,
      follow: true,
      'max-video-preview': -1, // Sin límite para vista previa de video
      'max-image-preview': 'large', // Vista previa de imagen grande
      'max-snippet': -1, // Sin límite para fragmentos
    },
  },

  // Verificación del sitio (descomenta y añade tus códigos si los tienes)
  // verification: {
  //   google: 'TU_CODIGO_DE_GOOGLE_SEARCH_CONSOLE',
  //   // yandex: 'TU_CODIGO_DE_YANDEX',
  // },

  // Manifest (si planeas hacerla una PWA más adelante)
  // manifest: '/manifest.json', // DEBES CREAR ESTE ARCHIVO: public/manifest.json
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* El link del favicon ya está aquí, los metadatos manejan los demás */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <Script src="https://cdn.conekta.io/checkout/latest/conekta.js" strategy="beforeInteractive" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
