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
    // This effect runs whenever the loading state or authentication state changes.
    // It is the single source of truth for routing logic after the initial app load.
    if (!state.isLoading) {
      if (state.userProfile.isAuthenticated) {
        // If the user is authenticated, check if their setup is complete.
        if (state.isSetupComplete) {
          router.replace('/dashboard');
        } else {
          // If authenticated but setup is not complete, they need to go to the wizard.
          router.replace('/app/setup');
        }
      } else {
        // If not authenticated, send them to the setup page, which will show the welcome/login screen.
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
