
// src/components/dashboard/AssistantMemoryCard.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FaEye } from "react-icons/fa";
import { AssistantWithMemory } from "@/types";
import { formatBytes } from "@/lib/utils";
import ConversationsDialog from './ConversationsDialog'; // Import the new dialog

interface AssistantMemoryCardProps {
  assistant: AssistantWithMemory;
  animationDelay?: string;
}

const AssistantMemoryCard = ({ assistant, animationDelay = "0s" }: AssistantMemoryCardProps) => {
  const MAX_MEMORY_BYTES = 50 * 1024 * 1024; // Example: 50MB per assistant
  const memoryPercentage = Math.min((assistant.totalMemory / MAX_MEMORY_BYTES) * 100, 100);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          <Button size="sm" variant="outline" onClick={() => setIsDialogOpen(true)}>
            <FaEye className="mr-2 h-4 w-4" />
            Ver Chats
          </Button>
        </CardContent>
      </Card>
      <ConversationsDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        assistant={assistant}
      />
    </>
  );
};

export default AssistantMemoryCard;
