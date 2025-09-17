import type { Metadata } from 'next';
import { APP_NAME } from '@/config/appConfig';

export const metadata: Metadata = {
  title: `Crear Asistente con IA | ${APP_NAME}`,
  description: `Genera un asistente virtual inteligente para tu negocio en segundos. Simplemente describe lo que necesitas y nuestra IA lo creará por ti. Conecta una Hoja de Google para darle conocimiento específico.`,
  keywords: [
    'crear asistente inteligente',
    'generador de chatbot',
    'asistente de ia para negocios',
    'crear chatbot con ia',
    'ia para whatsapp',
    'automatización con inteligencia artificial',
    'generador de asistentes virtuales',
    'chatbot desde prompt',
  ],
};

export default function MakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
