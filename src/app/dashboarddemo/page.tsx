
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import DashboardDemoPageContent from './DashboardDemoPageContent';

function DashboardDemoRedirector() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboarddemo/assistants');
    }, [router]);

    return (
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    );
}


export default function DashboardDemoPage() {
  return (
    <Suspense fallback={
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    }>
      <DashboardDemoRedirector />
    </Suspense>
  );
}
