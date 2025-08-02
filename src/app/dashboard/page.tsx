
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import { useApp } from '@/providers/AppProvider';

// This page now acts as a redirector to the default dashboard page.
export default function DashboardRedirector() {
    const router = useRouter();
    const { state } = useApp();
    const { isLoading, userProfile } = state;

    useEffect(() => {
        if (!isLoading) {
            if (!userProfile.isAuthenticated) {
                router.replace('/login');
            } else {
                router.replace('/dashboard/assistants');
            }
        }
    }, [isLoading, userProfile.isAuthenticated, router]);

    return (
        <PageContainer className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size={36} />
        </PageContainer>
    );
}
