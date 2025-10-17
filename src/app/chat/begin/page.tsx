// src/app/chat/begin/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page's content is now in a dialog.
// This page can now just be a redirect or trigger for the dialog.
// For simplicity, we'll redirect back to the chat dashboard,
// which will then decide if the welcome dialog should be shown.
export default function BeginRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // The dashboard page will handle showing the welcome flow
        // if the user is new.
        router.replace('/chat/dashboard');
    }, [router]);

    // You can show a loading spinner here if needed, but a quick redirect is usually fine.
    return null;
}
