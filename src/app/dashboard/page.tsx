"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingStatus from '@/components/shared/LoadingStatus';
import PageContainer from '@/components/layout/PageContainer';
import { useApp } from '@/providers/AppProvider';

// This page now acts as a redirector to the default dashboard page.
function DashboardRedirector() {
    const router = useRouter();
    const { state } = useApp();
    const { userProfile, loadingStatus } = state;

    useEffect(() => {
        // This effect will run when loadingStatus.active changes.
        // It ensures redirection happens only after the AppProvider has finished its initial load.
        if (!loadingStatus.active) {
            if (userProfile.isAuthenticated) {
                // If authenticated and setup is complete, go to the main dashboard view.
                router.replace('/dashboard/assistants');
            } else {
                // If not authenticated, send back to login.
                router.replace('/login');
            }
        }
    }, [loadingStatus.active, userProfile.isAuthenticated, router]);

    // Show the loading status component while the AppProvider is working.
    return (
        <PageContainer className="flex items-center justify-center min-h-screen">
            <LoadingStatus status={loadingStatus} />
        </PageContainer>
    );
}

export default DashboardRedirector;
