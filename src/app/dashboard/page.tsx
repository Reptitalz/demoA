
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { useApp } from '@/providers/AppProvider';
import DashboardPageContent from './DashboardPageContent';

// This page now acts as a smart router and a demo entry point.
function DashboardRedirector() {
    const router = useRouter();
    const { state } = useApp();
    const { userProfile, loadingStatus, isSetupComplete } = state;

    useEffect(() => {
        // This effect runs once the initial loading is complete.
        if (!loadingStatus.active) {
            // If the user is authenticated, they should be on a specific dashboard page.
            // If they land on the root /dashboard, redirect them to the default view.
            if (userProfile.isAuthenticated) {
                router.replace('/dashboard/assistants');
            }
            // If the user is NOT authenticated, they can stay on this page to view the demo.
        }
    }, [loadingStatus.active, userProfile.isAuthenticated, isSetupComplete, router]);

    // While loading, show a spinner.
    if (loadingStatus.active) {
        return (
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        );
    }
    
    // If loading is finished and the user is NOT authenticated, render the DashboardPageContent
    // which will be in demo mode.
    if (!userProfile.isAuthenticated) {
        return (
             <Suspense fallback={
                <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                    <LoadingSpinner size={36} />
                </PageContainer>
            }>
                <DashboardPageContent />
            </Suspense>
        )
    }

    // If authenticated, show a loading spinner while redirecting.
    return (
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    );
}

export default DashboardRedirector;
