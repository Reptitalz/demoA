"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingStatus from '@/components/shared/LoadingStatus';
import { useApp } from '@/providers/AppProvider';

const CollaboratorsPage = () => {
    const { status } = useSession();
    const router = useRouter();
    const { state } = useApp();

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/colaboradores/dashboard');
        }
         if (status === 'unauthenticated') {
            router.replace('/colaboradores/login');
        }
    }, [status, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <LoadingStatus status={state.loadingStatus} />
      </div>
    );
};

export default CollaboratorsPage;
