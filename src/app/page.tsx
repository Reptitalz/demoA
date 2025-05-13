
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { APP_NAME } from '@/config/appConfig';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) { // Only redirect after initial state load
      if (state.isSetupComplete) {
        if (!state.userProfile.isAuthenticated) {
          // Setup is complete, but user is not authenticated.
          // Send them to the login step (Step 3) of the setup wizard.
          dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
          router.replace('/setup');
        } else {
          // Setup is complete and user is authenticated.
          router.replace('/dashboard');
        }
      } else {
        // Setup is not complete.
        router.replace('/setup');
      }
    }
  }, [state.isLoading, state.isSetupComplete, state.userProfile.isAuthenticated, router, dispatch]);

  // Display a loading indicator while checking state
  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]"> {/* Adjust height based on header/footer */}
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground">Iniciando {APP_NAME}...</p>
      </div>
    </PageContainer>
  );
}

