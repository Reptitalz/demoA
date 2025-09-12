
// src/components/dashboard/ConversationsDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
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

interface ConversationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const ChatBubble = ({ message, assistant }: { message: ChatMessage; assistant: AssistantConfig }) => {
  const isUser = message.role === 'user';
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
              ? "bg-[#dcf8c6] dark:bg-[#054740] rounded-br-none"
              : "bg-white dark:bg-slate-700 rounded-bl-none"
          )}
        >
          <p className="text-black dark:text-white">{typeof message.content === 'string' ? message.content : '[Imagen]'}</p>
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

const ConversationDetailDialog = ({ open, onOpenChange, conversationId, assistant }: { open: boolean, onOpenChange: (open: boolean) => void, conversationId: string | null, assistant: AssistantConfig }) => {
    const { state } = useApp();
    const { toast } = useToast();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && conversationId && state.userProfile._id) {
            setIsLoading(true);
            fetch('/api/assistants/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, userId: state.userProfile._id.toString() }),
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load conversation details.');
                return res.json();
            })
            .then(setConversation)
            .catch(err => toast({ title: "Error", description: err.message, variant: "destructive" }))
            .finally(() => setIsLoading(false));
        }
    }, [open, conversationId, state.userProfile._id, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Historial de Chat</DialogTitle>
                    <DialogDescription>
                        Viendo la conversación con {conversation?.userIdentifier || 'un usuario'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow bg-slate-200 dark:bg-slate-800 rounded-md overflow-hidden relative">
                   <div className="absolute inset-0 chat-background opacity-50" />
                   <ScrollArea className="h-full relative">
                        <div className="p-4">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                        ) : conversation ? (
                            <div className="space-y-2">
                                {conversation.history.map((msg, index) => (
                                    <ChatBubble key={index} message={msg} assistant={assistant} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center p-4">No se pudo cargar la conversación.</p>
                        )}
                        </div>
                   </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const ConversationsDialog = ({ isOpen, onOpenChange, assistant }: ConversationsDialogProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && state.userProfile._id) {
      setIsLoading(true);
      fetch(`/api/assistants/conversations?assistantId=${assistant.id}&userId=${state.userProfile._id.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error('No se pudieron cargar las conversaciones.');
          return res.json();
        })
        .then(data => setConversations(data))
        .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, assistant.id, state.userProfile._id, toast]);
  
  const handleViewConversation = (convoId: string) => {
      setSelectedConversationId(convoId);
  }

  return (
    <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <FaComments /> Conversaciones de "{assistant.name}"
            </DialogTitle>
            <DialogDescription>
                Revisa los historiales de chat que tu asistente ha tenido.
            </DialogDescription>
            </DialogHeader>
            <div className="flex-grow border rounded-md overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-center text-muted-foreground p-8">Este asistente aún no tiene conversaciones.</p>
                    ) : (
                        <div className="space-y-2">
                        {conversations.map(convo => (
                            <div
                                key={convo._id}
                                className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                                onClick={() => handleViewConversation(convo._id)}
                            >
                                <div className="flex-grow overflow-hidden">
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <FaUser className="text-primary" />
                                        <span>{convo.userIdentifier}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate italic">
                                        "{convo.lastMessage}"
                                    </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground shrink-0">
                                    <p>Última act.</p>
                                    <p>{formatDistanceToNow(new Date(convo.updatedAt), { addSuffix: true, locale: es })}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
        
        <ConversationDetailDialog
            open={!!selectedConversationId}
            onOpenChange={(open) => !open && setSelectedConversationId(null)}
            conversationId={selectedConversationId}
            assistant={assistant}
        />
    </>
  );
};

export default ConversationsDialog;
