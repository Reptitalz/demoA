"use client";

import { useEffect, useState, type ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import { getFirebaseApp } from '@/lib/firebase';

function AnalyticsReporter() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const app = getFirebaseApp();
        if (!app) {
            console.log("Firebase app not available for Analytics.");
            return;
        };

        isSupported().then(supported => {
            if (supported) {
                const analytics = getAnalytics(app);
                const url = pathname + searchParams.toString();
                logEvent(analytics, 'page_view', { page_path: url });
                 console.log(`Analytics event logged: page_view for ${url}`);
            }
        });
    }, [pathname, searchParams]);

    return null;
}


export function FirebaseAnalyticsProvider({ children }: { children: ReactNode }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <>
            {isClient && (
                <Suspense fallback={null}>
                    <AnalyticsReporter />
                </Suspense>
            )}
            {children}
        </>
    );
}