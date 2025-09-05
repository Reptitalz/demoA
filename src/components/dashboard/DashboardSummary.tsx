
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Credits Card Special Layout */}
        <div 
          onClick={handleRechargeClick}
          className="p-3 rounded-lg transition-all duration-200 flex items-center cursor-pointer hover:bg-muted/80"
        >
          <div className="flex-grow">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-medium">Créditos</h3>
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold text-foreground">{credits || 0}</p>
              <p className="text-xs text-muted-foreground">Clic para recargar</p>
            </div>
          </div>
          <Button 
            size="icon"
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
            aria-label="Recargar créditos"
          >
            <FaPlus />
          </Button>
        </div>

        {/* Other Cards */}
        {summaryCards.map((card, index) => (
            <div
                key={index}
                onClick={card.onClick}
                className="p-3 rounded-lg transition-all duration-200 flex flex-col cursor-pointer hover:bg-muted/80"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <h3 className="text-sm font-medium">{card.title}</h3>
              </div>
              <div className="mt-1 flex-grow flex flex-col justify-center">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
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
