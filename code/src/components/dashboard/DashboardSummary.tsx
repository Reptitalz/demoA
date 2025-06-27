
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRobot } from "react-icons/fa";

const DashboardSummary = () => {
  const { state } = useApp();
  const { assistants } = state.userProfile;

  return (
    <div className="grid gap-4 grid-cols-1 mb-8">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asistentes Activos</CardTitle>
          <FaRobot className="h-5 w-5 text-brand-gradient" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-brand-gradient">
            {assistants.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Total de asistentes configurados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
