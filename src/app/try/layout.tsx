import type { Metadata } from 'next';
import { APP_NAME } from '@/config/appConfig';

export const metadata: Metadata = {
  title: `Prueba tu Asistente | ${APP_NAME}`,
  robots: {
    index: false, // Don't index the try page
    follow: false,
  }
};

export default function TryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
