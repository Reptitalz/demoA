
"use client";

import { Suspense } from 'react';
import DemoDashboardPageContent from '@/components/dashboard/demodashboard-page-content';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function DemoProfilePage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
          <LoadingSpinner size={36} />
        </PageContainer>
      }
    >
      <DemoDashboardPageContent />
    </Suspense>
  );
}
