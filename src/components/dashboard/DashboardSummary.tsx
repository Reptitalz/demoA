
"use client";

import { useApp } from "@/providers/AppProvider";
import { FaRobot } from "react-icons/fa";
import { Coins, Wallet, MessagesSquare } from 'lucide-react';
import { useState } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { MESSAGES_PER_CREDIT } from "@/config/appConfig";
import { cn } from "@/lib/utils";
import MessagesInfoDialog from "./MessagesInfoDialog";
import { useRouter } from "next/navigation";


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
      onClick: () => router.push('/dashboard/assistants'),
      isInteractive: true,
    },
    {
      title: "Créditos",
      value: credits || 0,
      description: "Clic para recargar",
      icon: Wallet,
      onClick: handleRechargeClick,
      isInteractive: true,
    },
    {
      title: "Mensajes",
      value: availableMessages.toLocaleString(),
      description: "Disponibles",
      icon: MessagesSquare,
      onClick: () => setIsMessagesInfoOpen(true),
      isInteractive: true,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {summaryCards.map((card, index) => (
            <div
                key={index}
                onClick={card.onClick}
                className={cn(
                  "p-3 rounded-lg transition-all duration-200",
                  card.isInteractive && "cursor-pointer hover:bg-muted/80"
                )}
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <card.icon className="h-4 w-4" />
                <h3 className="text-sm font-medium">{card.title}</h3>
              </div>
              <div className="mt-1">
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
