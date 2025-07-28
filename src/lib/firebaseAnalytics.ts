
// src/lib/firebaseAnalytics.ts
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAnalytics, logEvent, isSupported, Analytics } from "firebase/analytics";
import { app } from "./firebase"; // Use the initialized app

function useAnalytics() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);

    useEffect(() => {
        const initializeAnalytics = async () => {
            const isAnalyticsSupported = await isSupported();
            if (isAnalyticsSupported) {
                setAnalytics(getAnalytics(app));
            }
        };
        initializeAnalytics();
    }, []);

    return analytics;
}

function AnalyticsReporter() {
    const analytics = useAnalytics();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (analytics) {
            const url = pathname + searchParams.toString();
            logEvent(analytics, "screen_view", {
                firebase_screen: url,
                firebase_screen_class: "Next.js",
            });
        }
    }, [analytics, pathname, searchParams]);

    return null; // This component doesn't render anything
}


export function FirebaseAnalyticsProvider({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    // Only render the AnalyticsReporter on the client side
    return (
        <>
            {isClient && <AnalyticsReporter />}
            {children}
        </>
    );
}
