
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionPlansConfig } from "@/config/appConfig";
import { FaRobot, FaBoxOpen, FaExternalLinkAlt } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PlanViewer from "./PlanViewer"; 

const DashboardSummary = () => {
  const { state } = useApp();
  const { currentPlan, assistants } = state.userProfile;

  const planDetails = currentPlan ? subscriptionPlansConfig.find(p => p.id === currentPlan) : null;

  return (
    <div className="grid gap-4 grid-cols-2 mb-8">
      <Dialog>
        <DialogTrigger asChild>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn cursor-pointer" style={{animationDelay: "0.1s"}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
              <div className="flex items-center gap-1 text-primary"> {/* Uses new primary (purple) */}
                <FaBoxOpen className="h-5 w-5 text-brand-gradient" />
                <FaExternalLinkAlt className="h-3 w-3 opacity-70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-gradient">
                {planDetails ? planDetails.name : "N/D"}
              </div>
              <p className="text-xs text-muted-foreground">
                {planDetails ? `$${planDetails.priceMonthly}/mes` : "Sin plan activo"}
              </p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px] bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalles de tu Plan y Otras Opciones</DialogTitle>
            <DialogDescription>
              Aquí puedes ver tu plan actual y explorar otras opciones de suscripción.
            </DialogDescription>
          </DialogHeader>
          <PlanViewer currentPlanId={currentPlan} allPlans={subscriptionPlansConfig} />
        </DialogContent>
      </Dialog>

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
            {planDetails ? `de ${planDetails.assistantLimit === "unlimited" ? "Ilimitados" : planDetails.assistantLimit} permitidos` : "N/D"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
