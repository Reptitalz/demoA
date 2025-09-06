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

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* Asistentes Card */}
        <div 
            onClick={() => router.push('/dashboard/assistants')}
            className="relative aspect-square p-4 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <FaRobot className="h-6 w-6 text-blue-500" />
                    <h3 className="text-sm font-medium">Asistentes</h3>
                </div>
            </div>
            <div className="text-right">
                <p className="text-4xl font-bold text-foreground">{assistants.length}</p>
                <p className="text-xs text-muted-foreground">Total creados</p>
            </div>
        </div>

        {/* Créditos Card */}
        <div 
            onClick={handleRechargeClick}
            className="relative aspect-square p-4 rounded-lg transition-all duration-300 flex flex-col justify-between cursor-pointer bg-card hover:bg-card/80 glow-card shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-orange-500" />
                    <h3 className="text-sm font-medium">Créditos</h3>
                </div>
                <Button size="icon" variant="default" className="h-8 w-8 rounded-full bg-brand-gradient shadow-lg">
                    <FaPlus />
                </Button>
            </div>
            <div className="text-right">
                <p className="text-4xl font-bold text-foreground">{credits || 0}</p>
                <p className="text-xs text-muted-foreground">Clic para recargar</p>
            </div>
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
