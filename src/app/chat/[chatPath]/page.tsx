// src/app/chat/[chatPath]/page.tsx
"use client";
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// This page now acts as a redirector to the new conversation path.
export default function ChatRedirector() {
    const router = useRouter();
    const params = useParams();
    const chatPath = params.chatPath as string;

    useEffect(() => {
        if (chatPath) {
            router.replace(`/chat/conversation/${chatPath}`);
        }
    }, [chatPath, router]);

    return (
        <div className="h-full w-screen flex items-center justify-center bg-transparent">
            <LoadingSpinner size={40} />
        </div>
    );
}
