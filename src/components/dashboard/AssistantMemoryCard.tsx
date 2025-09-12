
// src/components/dashboard/AssistantMemoryCard.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FaComments, FaImage } from "react-icons/fa";
import { AssistantWithMemory, DatabaseConfig } from "@/types";
import { formatBytes } from "@/lib/utils";
import ConversationsDialog from './ConversationsDialog'; // Import the new dialog
import ContactsDialog from './ContactsDialog';
import { useApp } from '@/providers/AppProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AssistantMemoryCardProps {
  assistant: AssistantWithMemory;
  animationDelay?: string;
}

const AssistantMemoryCard = ({ assistant, animationDelay = "0s" }: AssistantMemoryCardProps) => {
  const { state } = useApp();
  const MAX_MEMORY_BYTES = 50 * 1024 * 1024; // 50MB per assistant
  const memoryPercentage = Math.min((assistant.totalMemory / MAX_MEMORY_BYTES) * 100, 100);
  const [isConversationsOpen, setIsConversationsOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  
  return (
    <>
      <Card className="animate-fadeIn shadow-sm hover:shadow-md transition-shadow" style={{ animationDelay }}>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <Avatar>
              <AvatarImage src={assistant.imageUrl} alt={assistant.name} />
              <AvatarFallback>{assistant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{assistant.name}</p>
              <div className="text-xs text-muted-foreground">
                  <p>Memoria Usada: {formatBytes(assistant.totalMemory)}</p>
                  <Progress value={memoryPercentage} className="h-1 mt-1" />
              </div>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" onClick={() => setIsContactsOpen(true)} className="h-8 w-8">
                            <FaImage />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver Imágenes y Contactos</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="outline" onClick={() => setIsConversationsOpen(true)} className="h-8 w-8">
                            <FaComments/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ver Chats</p>
                    </TooltipContent>
                </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
      <ConversationsDialog
        isOpen={isConversationsOpen}
        onOpenChange={setIsConversationsOpen}
        assistant={assistant}
      />
       <ContactsDialog
          isOpen={isContactsOpen}
          onOpenChange={setIsContactsOpen}
          assistant={assistant}
      />
    </>
  );
};

export default AssistantMemoryCard;
