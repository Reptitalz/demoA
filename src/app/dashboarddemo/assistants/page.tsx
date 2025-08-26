
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';
import DashboardPageContent from '@/app/dashboard/DashboardPageContent';

export default function DemoAssistantsPage() {
    const router = useRouter();
    
    // Redirect to the unified dashboard
    useEffect(() => {
        router.replace('/dashboard/assistants');
    }, [router]);

    return (
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
            <p className="ml-4">Redirigiendo...</p>
        </PageContainer>
    );
}
