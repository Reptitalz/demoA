
"use client";

import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import DashboardPageContent from '@/app/dashboard/DashboardPageContent';

export default function AdminPage() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <div className="bg-background h-full">
                <DashboardPageContent />
            </div>
        </Suspense>
    )
}
