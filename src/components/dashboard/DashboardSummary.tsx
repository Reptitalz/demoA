
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRobot } from "react-icons/fa";
import { Coins, Wallet, MessagesSquare } from 'lucide-react';
import { useState } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { MESSAGES_PER_CREDIT } from "@/config/appConfig";
import { cn } from '@/lib/utils';
import MessagesInfoDialog from "./MessagesInfoDialog";

const DashboardSummary = () => {
  const { state } = useApp();
  const { assistants, credits } = state.userProfile;
  
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isMessagesInfoOpen, setIsMessagesInfoOpen] = useState(false);

  // Calculate total messages from credits
  const totalMessagesFromCredits = (credits || 0) * MESSAGES_PER_CREDIT;
  // Calculate total consumed messages from all assistants
  const totalConsumedMessages = assistants.reduce((sum, asst) => sum + (asst.messageCount || 0), 0);
  // The final available messages is the difference
  const availableMessages = totalMessagesFromCredits - totalConsumedMessages;


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Combined Small Cards */}
        <div className="md:col-span-1 grid grid-cols-2 gap-4">
          {/* Assistants */}
          <Card 
            className={cn(
              "shadow-lg hover:shadow-xl transition-all duration-300",
              "bg-gradient-to-br from-card to-muted/30 hover:from-muted/30"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistentes</CardTitle>
              <FaRobot className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {assistants.length}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card 
            className={cn(
              "shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer",
              "bg-gradient-to-br from-card to-muted/30 hover:from-muted/30"
            )}
            onClick={() => setIsRechargeOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary flex items-center gap-1.5">
                <Coins className="h-5 w-5 text-accent" /> {credits || 0}
              </div>
              <p className="text-xs text-muted-foreground">Recargar</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Messages Card */}
        <Card 
          className={cn(
            "shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-2 cursor-pointer",
             "bg-gradient-to-br from-card to-primary/10 hover:from-primary/10"
          )}
          onClick={() => setIsMessagesInfoOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Disponibles</CardTitle>
            <MessagesSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {availableMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para enviar
            </p>
          </CardContent>
        </Card>
      </div>
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
      <MessagesInfoDialog isOpen={isMessagesInfoOpen} onOpenChange={setIsMessagesInfoOpen} />
    </>
  );
};

export default DashboardSummary;
