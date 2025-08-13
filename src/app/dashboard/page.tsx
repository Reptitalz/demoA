
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
        if (!loadingStatus.active) {
            if (!userProfile.isAuthenticated) {
                router.replace('/login');
            } else {
                router.replace('/dashboard/assistants');
            }
        }
    }, [loadingStatus.active, userProfile.isAuthenticated, router]);

    return (
        <PageContainer className="flex items-center justify-center min-h-screen">
            <LoadingStatus status={loadingStatus} />
        </PageContainer>
    );
}

export default DashboardRedirector;
