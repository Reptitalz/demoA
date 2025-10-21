// src/components/dashboard/ConversationsDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FaComments, FaUser, FaRobot, FaSpinner } from 'react-icons/fa';
import type { AssistantConfig, Conversation, ChatMessage } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ChatBubble = ({ message, assistant }: { message: ChatMessage; assistant: AssistantConfig }) => {
  const isUser = message.role === 'user';
  const contentText = typeof message.content === 'string' ? message.content : '[Contenido no textual]';
  return (
    <div className={cn("flex w-full max-w-md mx-auto py-2", isUser ? "justify-end" : "justify-start")}>
      <div className="flex items-end gap-2">
        {!isUser && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={assistant.imageUrl} />
            <AvatarFallback>{assistant.name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isUser
              ? "bg-green-100 dark:bg-green-900 rounded-br-none"
              : "bg-white dark:bg-slate-700 rounded-bl-none"
          )}
        >
          <p className="text-black dark:text-white">{contentText}</p>
        </div>
        {isUser && (
          <Avatar className="h-6 w-6">
            <AvatarFallback><FaUser/></AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

const ConversationDetailView = ({ conversation, assistant, onBack }: { conversation: Conversation | null, assistant: AssistantConfig, onBack: () => void }) => {
    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Selecciona una conversación para ver los detalles.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <Button variant="ghost" size="sm" onClick={onBack}>&larr; Volver</Button>
                <h4 className="font-semibold mt-2">Chat con {conversation.userIdentifier}</h4>
                <p className="text-xs text-muted-foreground">
                    Última actividad: {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true, locale: es })}
                </p>
            </div>
            <ScrollArea className="flex-grow bg-slate-100 dark:bg-slate-900">
                 <div className="p-4 space-y-2">
                    {conversation.history.map((msg, index) => (
                        <ChatBubble key={index} message={msg} assistant={assistant} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

interface ConversationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistants: AssistantConfig[];
}

const ConversationsDialog = ({ isOpen, onOpenChange, assistants }: ConversationsDialogProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const selectedAssistant = useMemo(() => {
    return assistants.find(a => a.id === selectedAssistantId) || null;
  }, [selectedAssistantId, assistants]);

  useEffect(() => {
    if (isOpen && selectedAssistantId && state.userProfile._id) {
      setIsLoading(true);
      setSelectedConversation(null); // Reset detail view
      fetch(`/api/assistants/conversations?assistantId=${selectedAssistantId}&userId=${state.userProfile._id.toString()}`)
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'No se pudieron cargar las conversaciones.');
          }
          return res.json();
        })
        .then(data => setConversations(data))
        .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
        .finally(() => setIsLoading(false));
    } else {
        setConversations([]);
    }
  }, [isOpen, selectedAssistantId, state.userProfile._id, toast]);
  
  useEffect(() => {
    if (isOpen && assistants.length > 0 && !selectedAssistantId) {
        setSelectedAssistantId(assistants[0].id);
    }
  }, [isOpen, assistants, selectedAssistantId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none sm:max-w-4xl sm:h-auto sm:max-h-[90vh] flex flex-col p-0" onInteractOutside={(e) => { e.preventDefault(); }}>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FaComments /> Monitor de Conversaciones
          </DialogTitle>
          <DialogDescription>
            Revisa los chats que tus asistentes han tenido.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-[300px_1fr] flex-grow min-h-0">
            <div className="border-r flex flex-col">
                <div className="p-4 border-b">
                    <Select value={selectedAssistantId || ''} onValueChange={setSelectedAssistantId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un asistente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {assistants.map(asst => (
                                <SelectItem key={asst.id} value={asst.id}>{asst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <ScrollArea className="flex-grow">
                    <div className="p-2">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground p-4">No hay conversaciones para este asistente.</p>
                        ) : (
                            <div className="space-y-1">
                                {conversations.map(convo => (
                                    <div
                                        key={convo._id}
                                        onClick={() => setSelectedConversation(convo)}
                                        className={cn(
                                            "p-3 rounded-md cursor-pointer hover:bg-muted",
                                            selectedConversation?._id === convo._id && "bg-muted"
                                        )}
                                    >
                                        <p className="font-semibold text-sm truncate">{convo.userIdentifier}</p>
                                        <p className="text-xs text-muted-foreground truncate italic">
                                            "{typeof convo.lastMessage === 'string' ? convo.lastMessage : '[Mensaje no textual]'}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            <div className="hidden md:flex flex-col bg-slate-50 dark:bg-slate-900/50">
                 {selectedAssistant ? (
                    <ConversationDetailView 
                        conversation={selectedConversation} 
                        assistant={selectedAssistant}
                        onBack={() => setSelectedConversation(null)}
                    />
                ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Selecciona un asistente para empezar.</p>
                    </div>
                )}
            </div>
        </div>

        <DialogFooter className="p-6 border-t mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationsDialog;
