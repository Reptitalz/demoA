
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionPlansConfig } from "@/config/appConfig";
import { Bot, Package } from "lucide-react";

const DashboardSummary = () => {
  const { state } = useApp();
  const { currentPlan, assistants } = state.userProfile;

  const planDetails = currentPlan ? subscriptionPlansConfig.find(p => p.id === currentPlan) : null;

  return (
    <div className="grid gap-4 grid-cols-2 mb-8">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.1s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          <Package className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {planDetails ? planDetails.name : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {planDetails ? `$${planDetails.priceMonthly}/month` : "No active plan"}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.2s"}}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assistants</CardTitle>
          <Bot className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {assistants.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {planDetails ? `of ${planDetails.assistantLimit === "unlimited" ? "Unlimited" : planDetails.assistantLimit} allowed` : "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
