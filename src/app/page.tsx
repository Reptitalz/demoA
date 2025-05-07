
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function HomePage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) { // Only redirect after initial state load
      if (state.isSetupComplete) {
        router.replace('/dashboard');
      } else {
        router.replace('/setup');
      }
    }
  }, [state.isSetupComplete, state.isLoading, router]);

  // Display a loading indicator while checking state
  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]"> {/* Adjust height based on header/footer */}
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground">Initializing AssistAI Manager...</p>
      </div>
    </PageContainer>
  );
}
