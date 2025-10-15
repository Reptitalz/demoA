// src/app/chat/admin/page.tsx
"use client";

import React, { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminHomePage from './AdminHomePage'; // Import the new client component

// This component will now act as a server-side wrapper with a Suspense boundary.
export default function AdminPage() {
  return (
    <Suspense fallback={
        <PageContainer className="flex items-center justify-center h-full">
            <LoadingSpinner size={36} />
        </PageContainer>
    }>
      <AdminHomePage />
    </Suspense>
  );
}
