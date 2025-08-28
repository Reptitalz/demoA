"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

function DashboardDemoPage() {
  const router = useRouter();

  // The demo pages are now structured. Redirect the base /dashboarddemo to the assistants view.
  useEffect(() => {
    router.replace('/dashboarddemo/assistants');
  }, [router]);

  return (
    <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
    </PageContainer>
  );
}

export default function DashboardDemoRedirector() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <DashboardDemoPage />
        </Suspense>
    )
}
