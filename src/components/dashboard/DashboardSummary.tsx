
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRobot } from "react-icons/fa";
import { Coins, Wallet } from 'lucide-react';
import { useState } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';

const DashboardSummary = () => {
  const { state } = useApp();
  const { assistants, credits } = state.userProfile;
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  return (
    <>
      <div className="grid gap-4 grid-cols-2 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.1s"}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistentes Configurados</CardTitle>
            <FaRobot className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {assistants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de asistentes creados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn cursor-pointer" 
          style={{animationDelay: "0.2s"}}
          onClick={() => setIsRechargeOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo de Créditos</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" /> {credits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clic para recargar saldo
            </p>
          </CardContent>
        </Card>
      </div>
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
    </>
  );
};

export default DashboardSummary;
