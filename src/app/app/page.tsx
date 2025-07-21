
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { APP_NAME } from '@/config/appConfig';
import { Progress } from '@/components/ui/progress';

export default function AppRootPage() {
  const { state } = useApp();
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) { // Stop just before 100% to let the redirect happen
          clearInterval(timer);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // This effect runs whenever the loading state or authentication state changes.
    // It is the single source of truth for routing logic after the initial app load.
    if (!state.isLoading) {
      setProgress(100); // Complete the progress bar before redirecting
      setTimeout(() => {
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
      }, 300); // A brief delay to show completion
    }
  }, [state.isLoading, state.isSetupComplete, state.userProfile.isAuthenticated, router]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <LoadingSpinner size={36} />
        <div className="w-full text-center">
            <p className="text-muted-foreground text-sm mb-2">Iniciando {APP_NAME}...</p>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</p>
        </div>
      </div>
    </PageContainer>
  );
}
