
"use client";

import CollaboratorDashboardPage from "../page";

// This component simply re-uses the main collaborator dashboard page.
// The dashboard page itself has logic to detect if a user is authenticated or not.
// If not authenticated, it shows demo data.
export default function CollaboratorDashboardDemoPage() {
    return <CollaboratorDashboardPage />;
}
