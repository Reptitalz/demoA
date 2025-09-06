
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asistentes y Créditos Cards */}
        <div 
            onClick={() => router.push('/dashboard/assistants')}
            className="relative p-4 rounded-lg transition-all duration-300 flex items-center gap-4 cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
        >
            <FaRobot className="h-10 w-10 text-blue-500/20" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-5xl font-extrabold text-blue-500">{assistants.length}</span>
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-foreground">Asistentes</h3>
                <p className="text-xs text-muted-foreground">Total creados</p>
            </div>
        </div>

        <div 
            onClick={handleRechargeClick}
            className="relative p-4 rounded-lg transition-all duration-300 flex items-center gap-4 cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
        >
            <Wallet className="h-10 w-10 text-orange-500/20" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-5xl font-extrabold text-orange-500">{credits || 0}</span>
            </div>
             <div className="flex-1">
                <h3 className="font-semibold text-foreground">Créditos</h3>
                <p className="text-xs text-muted-foreground">Disponibles</p>
            </div>
            <Button size="icon" variant="default" className="h-8 w-8 rounded-full bg-brand-gradient shadow-lg">
                <FaPlus />
            </Button>
        </div>
      </div>
      
      {/* Mensajes Card */}
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
