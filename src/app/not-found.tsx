
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { APP_NAME } from '@/config/appConfig';
import PageContainer from '@/components/layout/PageContainer';

export default function NotFound() {
  return (
    <PageContainer className="flex flex-col items-center justify-center text-center py-16">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full animate-fadeIn">
            <div className="mb-6">
                <FaExclamationTriangle className="mx-auto h-16 w-16 text-destructive animate-pulse" />
            </div>
            <h1 className="text-4xl font-extrabold text-brand-gradient">
                Error 404
            </h1>
            <p className="text-lg mt-2 mb-6 text-muted-foreground">
                Página No Encontrada
            </p>
            <p className="mb-8 text-foreground">
                Lo sentimos, la página que buscas no existe o ha sido movida. Pero no te preocupes, puedes volver al inicio.
            </p>
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105">
                <Link href="/">
                    <FaHome className="mr-2" />
                    Ir a la página principal
                </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-8">
                &copy; {APP_NAME}
            </p>
        </div>
    </PageContainer>
  );
}
