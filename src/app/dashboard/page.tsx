
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { useApp } from '@/providers/AppProvider';

// This page now acts as a smart router.
function DashboardRouter() {
    const router = useRouter();
    const { state } = useApp();
    const { userProfile, loadingStatus } = state;

    useEffect(() => {
        // This effect runs once the initial loading is complete.
        if (!loadingStatus.active) {
            // If the user is authenticated, they should be on a specific dashboard page.
            // If they land on the root /dashboard, redirect them to the default view.
            if (userProfile.isAuthenticated) {
                router.replace('/dashboard/assistants');
            } else {
            // If the user is NOT authenticated, show the demo dashboard.
                router.replace('/dashboarddemo/assistants');
            }
        }
    }, [loadingStatus.active, userProfile.isAuthenticated, router]);

    // While loading, show a spinner. This covers the session check time.
    return (
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    );
}

export default function DashboardRedirector() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <DashboardRouter />
        </Suspense>
    )
}
