
"use client";

import { Progress } from "@/components/ui/progress";
import { FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";
import type { AppState } from "@/types";

interface LoadingStatusProps {
  status: AppState['loadingStatus'];
  className?: string;
}

const LoadingStatus = ({ status, className }: LoadingStatusProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 text-center w-full max-w-sm", className)}>
        <FaSpinner size={32} className="animate-spin text-primary" />
        <div>
            <p className="font-semibold text-lg text-foreground">{status.message}</p>
            <p className="text-sm text-muted-foreground">Por favor, espera un momento...</p>
        </div>
        <Progress value={status.progress} className="w-full h-2" />
    </div>
  );
};

export default LoadingStatus;
