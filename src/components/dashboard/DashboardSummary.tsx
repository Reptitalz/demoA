
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRobot } from "react-icons/fa";
import { Coins, Wallet, MessagesSquare } from 'lucide-react';
import { useState } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { MESSAGES_PER_CREDIT } from "@/config/appConfig";


const DashboardSummary = () => {
  const { state } = useApp();
  const { assistants, credits } = state.userProfile;
  
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const availableMessages = (credits || 0) * MESSAGES_PER_CREDIT;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="grid grid-cols-2 gap-4 flex-1 md:flex-none">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 aspect-square flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asistentes</CardTitle>
                <FaRobot className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {assistants.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total
                </p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer aspect-square flex flex-col justify-center" 
              onClick={() => setIsRechargeOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                <Wallet className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" /> {credits || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clic para recargar
                </p>
              </CardContent>
            </Card>
        </div>
        
        <div className="flex-1">
             <Card 
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col justify-center"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensajes Disponibles</CardTitle>
                <MessagesSquare className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {availableMessages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Disponibles para enviar
                </p>
              </CardContent>
            </Card>
        </div>
      </div>
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
    </>
  );
};

export default DashboardSummary;
