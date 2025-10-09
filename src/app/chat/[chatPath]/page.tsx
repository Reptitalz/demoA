// This file is no longer needed as conversations are handled by the ChatViewManager.
// It can be safely deleted.
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
        } else {
            // If there's no chatPath for some reason, go to the dashboard.
            router.replace(`/chat/dashboard`);
        }
    }, [chatPath, router]);

    return (
        <div className="h-full w-screen flex items-center justify-center bg-transparent">
            <LoadingSpinner size={40} />
        </div>
    );
}
