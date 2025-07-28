
"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { getFirebaseApp } from '@/lib/firebase';

export function FirebaseAnalyticsProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const app = getFirebaseApp();
        if (app) {
            isSupported().then(supported => {
                if (supported) {
                    const analytics = getAnalytics(app);
                    const url = pathname + searchParams.toString();
                    logEvent(analytics, 'page_view', { page_path: url });
                }
            });
        }
    }, [pathname, searchParams]);

    return null; // This component doesn't render anything visible
}
