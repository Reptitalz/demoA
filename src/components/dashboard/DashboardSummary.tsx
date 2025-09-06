"use client";

import { useApp } from "@/providers/AppProvider";
import { FaRobot, FaPlus } from "react-icons/fa";
import { Coins, Wallet, MessagesSquare } from 'lucide-react';
import { useState } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { MESSAGES_PER_CREDIT } from "@/config/appConfig";
import { cn } from "@/lib/utils";
import MessagesInfoDialog from "./MessagesInfoDialog";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

const DashboardSummary = () => {
  const { state } = useApp();
  const { assistants, credits, isAuthenticated } = state.userProfile;
  const router = useRouter();
  
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isMessagesInfoOpen, setIsMessagesInfoOpen] = useState(false);

  const isDemoMode = !isAuthenticated;

  // Calculate total messages from credits
  const totalMessagesFromCredits = (credits || 0) * MESSAGES_PER_CREDIT;
  // Calculate total consumed messages from all assistants
  const totalConsumedMessages = assistants.reduce((sum, asst) => sum + (asst.messageCount || 0), 0);
  // The final available messages is the difference
  const availableMessages = totalMessagesFromCredits - totalConsumedMessages;

  const handleRechargeClick = () => {
    if (isDemoMode) {
      router.push('/login');
    } else {
      setIsRechargeOpen(true);
    }
  }

  const summaryCards = [
    { title: 'Asistentes', value: assistants.length, description: 'Total creados', icon: FaRobot, color: 'text-blue-500', action: () => router.push('/dashboard/assistants')},
    { title: 'Créditos', value: credits || 0, description: 'Clic para recargar', icon: Wallet, color: 'text-orange-500', action: handleRechargeClick },
  ];


  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {summaryCards.map((card, index) => {
           const Icon = card.icon;
           return (
            <div 
                key={index}
                onClick={card.action}
                className="relative aspect-square p-3 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", card.color)} />
                        <h3 className="text-xs font-medium">{card.title}</h3>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-foreground">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground">{card.description}</p>
                </div>
            </div>
          )
        })}
      </div>
      
       <div 
        onClick={() => setIsMessagesInfoOpen(true)}
        className="mt-4 relative p-4 rounded-lg transition-all duration-300 flex items-center justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
      >
        <div className="flex items-center gap-3">
          <MessagesSquare className="h-6 w-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-sm">Mensajes</h3>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{availableMessages.toLocaleString()}</p>
      </div>
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
      <MessagesInfoDialog isOpen={isMessagesInfoOpen} onOpenChange={setIsMessagesInfoOpen} />
    </>
  );
};

export default DashboardSummary;
