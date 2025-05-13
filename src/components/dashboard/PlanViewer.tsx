
"use client";

import type { SubscriptionPlanDetails, SubscriptionPlanType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ListChecks, TrendingUp, Briefcase, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/AppProvider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const planIcons: { [key in SubscriptionPlanType]: React.ElementType } = {
  free: CheckCircle,
  standard_39: ListChecks,
  premium_179: TrendingUp,
  business_270: Briefcase,
};

interface PlanViewerProps {
  currentPlanId: SubscriptionPlanType | null;
  allPlans: SubscriptionPlanDetails[];
}

const PlanViewer = ({ currentPlanId, allPlans }: PlanViewerProps) => {
  const { dispatch } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const handleSelectPlan = (planId: SubscriptionPlanType) => {
    // Simulate updating the plan or navigating to a plan change confirmation page
    // For now, we'll just update it in the wizard state for demonstration if user were in setup
    // and dispatch an update to userProfile which would then be saved.

    dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: planId });
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: { currentPlan: planId } });
    
    toast({
      title: "Plan Actualizado",
      description: `Has cambiado tu plan a ${allPlans.find(p => p.id === planId)?.name}.`,
    });
    // Potentially close the dialog or navigate elsewhere
    // For this example, we assume the dialog might stay open or be closed by the user.
  };


  return (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      {allPlans.map((plan) => {
        const Icon = planIcons[plan.id];
        const isCurrentPlan = currentPlanId === plan.id;

        return (
          <Card
            key={plan.id}
            className={cn(
              "transition-all duration-200 shadow-md hover:shadow-lg",
              isCurrentPlan && "border-primary ring-2 ring-primary bg-primary/5"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={cn("h-7 w-7", isCurrentPlan ? "text-primary" : "text-accent")} />
                  <CardTitle className={cn("text-lg", isCurrentPlan && "text-primary")}>{plan.name}</CardTitle>
                </div>
                {isCurrentPlan && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1 rounded-full bg-primary/10">
                    <Star size={14} />
                    Plan Actual
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className={cn("text-2xl font-bold", isCurrentPlan ? "text-primary" : "text-accent")}>
                  ${plan.priceMonthly}
                  <span className={cn("text-sm font-normal", isCurrentPlan ? "text-primary/80" : "text-muted-foreground")}>/mes</span>
                </p>
                 <p className={cn("text-sm", isCurrentPlan ? "text-primary/90" : "text-muted-foreground")}>
                    {plan.assistantLimit === "unlimited" ? "Ilimitados" : plan.assistantLimit} {typeof plan.assistantLimit === 'number' && plan.assistantLimit === 1 ? 'Asistente' : 'Asistentes'}
                  </p>
              </div>
              
              <ul className="space-y-1.5 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className={cn("h-4 w-4 mr-2 shrink-0", isCurrentPlan ? "text-primary/80" : "text-green-500")} />
                    <span className={isCurrentPlan ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
                  </li>
                ))}
              </ul>
              {!isCurrentPlan && (
                <Button 
                  className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Cambiar a {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PlanViewer;

