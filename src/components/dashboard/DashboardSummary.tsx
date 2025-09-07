
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

interface DashboardSummaryProps {
  currentPath: string;
}

const DashboardSummary = ({ currentPath }: DashboardSummaryProps) => {
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
  
  const showMessagesCard = currentPath && !currentPath.endsWith('/databases');

  const summaryCards = [
    { title: 'Asistentes', value: assistants.length, description: 'Total creados', icon: FaRobot, color: 'text-blue-500', action: () => router.push('/dashboard/assistants')},
    { title: 'Créditos', value: credits || 0, description: 'Clic para recargar', icon: Wallet, color: 'text-orange-500', action: handleRechargeClick },
  ];


  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {summaryCards.map((card, index) => {
           const Icon = card.icon;
           return (
            <div 
                key={index}
                onClick={card.action}
                className="relative p-2 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                        <Icon className={cn("h-4 w-4", card.color)} />
                        <h3 className="text-xs font-medium">{card.title}</h3>
                    </div>
                </div>
                <div className="text-right mt-1">
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground">{card.description}</p>
                </div>
            </div>
          )
        })}
      </div>
      
       {showMessagesCard && (
         <div 
            onClick={() => setIsMessagesInfoOpen(true)}
            className="relative p-4 rounded-lg transition-all duration-300 flex items-center justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
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
        )}
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
      <MessagesInfoDialog isOpen={isMessagesInfoOpen} onOpenChange={setIsMessagesInfoOpen} />
    </>
  );
};

export default DashboardSummary;

