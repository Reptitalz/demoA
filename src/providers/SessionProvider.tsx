
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

const NextAuthSessionProvider = ({ children }: { children: ReactNode }) => {
  // This component is no longer used for session management but kept to avoid breaking imports if any remain.
  // It can be removed once all imports are confirmed to be gone.
  return <>{children}</>;
};

export default NextAuthSessionProvider;
