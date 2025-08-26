
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';

function DashboardDemoRedirector() {
    const router = useRouter();

    useEffect(() => {
        // This page now just redirects to the main dashboard, which handles demo mode.
        router.replace('/dashboard');
    }, [router]);

    return (
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
            <p className="ml-4">Cargando modo de demostración...</p>
        </PageContainer>
    );
}

export default function DashboardDemoPage() {
  return (
      <DashboardDemoRedirector />
  );
}
