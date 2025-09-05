
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
     {
      title: "Asistentes",
      value: assistants.length,
      description: "Total creados",
      icon: FaRobot,
      color: "text-blue-500",
      onClick: () => router.push('/dashboard/assistants'),
    },
    {
      title: "Créditos",
      value: credits || 0,
      description: "Clic para recargar",
      icon: Wallet,
      color: "text-orange-500",
      onClick: handleRechargeClick,
    },
    {
      title: "Mensajes",
      value: availableMessages.toLocaleString(),
      description: "Disponibles",
      icon: MessagesSquare,
      color: "text-green-500",
      onClick: () => setIsMessagesInfoOpen(true),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
            <div
                key={index}
                onClick={card.onClick}
                className={cn(
                    "relative aspect-square p-4 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer",
                    "bg-card hover:bg-card/80 glow-card"
                )}
            >
               <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <card.icon className={cn("h-4 w-4", card.color)} />
                        <h3 className="text-sm font-medium">{card.title}</h3>
                    </div>
                    {card.title === "Créditos" && (
                         <Button 
                            size="icon"
                            className="h-7 w-7 rounded-full bg-primary hover:bg-primary/90 shadow-lg shrink-0"
                            aria-label="Recargar créditos"
                          >
                            <FaPlus size={12} />
                          </Button>
                    )}
               </div>

              <div className="text-left">
                <p className="text-4xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </div>
        ))}
      </div>
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
      <MessagesInfoDialog isOpen={isMessagesInfoOpen} onOpenChange={setIsMessagesInfoOpen} />
    </>
  );
};

export default DashboardSummary;
