
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getAnalytics, logEvent, isSupported, type Analytics } from "firebase/analytics";
import { app } from "./firebase"; // Use the initialized app

export function FirebaseAnalyticsProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);

    useEffect(() => {
        const initializeAnalytics = async () => {
            if (app.options.apiKey && (await isSupported())) {
                setAnalytics(getAnalytics(app));
            }
        };
        initializeAnalytics();
    }, []);

    useEffect(() => {
        if (analytics) {
            const url = pathname + searchParams.toString();
            logEvent(analytics, "screen_view", {
                firebase_screen: url,
                firebase_screen_class: "Next.js",
            });
        }
    }, [analytics, pathname, searchParams]);

    return children;
}
