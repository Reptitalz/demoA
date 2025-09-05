
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
      description: "Disponibles",
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
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
            {summaryCards.slice(0, 2).map((card) => {
              const Icon = card.icon;
              return (
                <div
                    key={card.title}
                    onClick={card.title !== 'Créditos' ? card.onClick : undefined}
                    className="relative p-4 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer bg-card hover:bg-card/80 glow-card"
                >
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium">{card.title}</h3>
                        <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-3xl font-bold">{card.value}</span>
                        {card.title === 'Créditos' && (
                            <Button size="icon" variant="default" onClick={card.onClick} className="h-8 w-8 rounded-full bg-brand-gradient shadow-lg">
                                <FaPlus />
                            </Button>
                        )}
                    </div>
                     <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </div>
              )
            })}
        </div>

        {(() => {
          const card = summaryCards[2];
          const Icon = card.icon;
          return (
            <div
                onClick={card.onClick}
                className="relative p-4 rounded-lg transition-all duration-300 flex items-center justify-between cursor-pointer bg-card hover:bg-card/80 glow-card"
            >
                <div className="flex items-center gap-3">
                    <Icon className={cn("h-6 w-6", card.color)} />
                    <div>
                        <h3 className="text-sm font-medium">{card.title}</h3>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                    </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })()}
      </div>
      
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
      <MessagesInfoDialog isOpen={isMessagesInfoOpen} onOpenChange={setIsMessagesInfoOpen} />
    </>
  );
};

export default DashboardSummary;
