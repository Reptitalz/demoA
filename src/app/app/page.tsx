
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { APP_NAME } from '@/config/appConfig';

export default function AppRootPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) { 
      if (state.isSetupComplete) {
        if (!state.userProfile.isAuthenticated) {
          dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
          router.replace('/app/setup');
        } else {
          router.replace('/app/dashboard');
        }
      } else {
        router.replace('/app/setup');
      }
    }
  }, [state.isLoading, state.isSetupComplete, state.userProfile.isAuthenticated, router, dispatch]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={36} /> {/* Adjusted size */}
        <p className="text-muted-foreground text-xs">Iniciando {APP_NAME}...</p> {/* Adjusted size */}
      </div>
    </PageContainer>
  );
}
