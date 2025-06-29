"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { APP_NAME } from '@/config/appConfig';

export default function AppRootPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) {
      // If user is authenticated and has completed setup, go to dashboard.
      if (state.userProfile.isAuthenticated && state.isSetupComplete) {
        router.replace('/app/dashboard');
      } else {
        // Otherwise, send them to the setup page.
        // The setup page will decide whether to show the welcome screen (for unauthenticated users)
        // or the wizard (for authenticated users without a complete setup).
        router.replace('/app/setup');
      }
    }
  }, [state.isLoading, state.isSetupComplete, state.userProfile.isAuthenticated, router]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={36} />
        <p className="text-muted-foreground text-xs">Iniciando {APP_NAME}...</p>
      </div>
    </PageContainer>
  );
}
