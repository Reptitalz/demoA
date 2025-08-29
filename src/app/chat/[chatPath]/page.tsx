// src/app/chat/[chatPath]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FaWhatsapp, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AssistantConfig } from '@/types';
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { useToast } from '@/hooks/use-toast';

const ChatBubble = ({ text, isUser, time }: { text: string; isUser: boolean; time: string }) => (
  <div className={cn("flex mb-2.5 animate-fadeIn", isUser ? "justify-end" : "justify-start")}>
    <div
      className={cn(
        "rounded-xl px-4 py-2.5 max-w-[85%] shadow-md text-sm leading-relaxed",
        isUser
          ? "bg-[#dcf8c6] dark:bg-[#054740] text-gray-800 dark:text-gray-100"
          : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
      )}
    >
      <p>{text}</p>
      <p className="text-xs text-right mt-1.5 text-gray-500 dark:text-gray-400">{time}</p>
    </div>
  </div>
);


const DesktopChatPage = () => {
  const params = useParams();
  const { toast } = useToast();
  const chatPath = params.chatPath as string;
  const [assistant, setAssistant] = useState<Partial<AssistantConfig> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string, isUser: boolean, time: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // For real chat, we need session IDs
  const [sessionId, setSessionId] = useState<string>('');
  const [executionId, setExecutionId] = useState<string>('');
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Generate or retrieve session IDs from localStorage
    const getSessionInfo = () => {
        let sid = localStorage.getItem(`sessionId_${chatPath}`);
        if (!sid) {
            sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem(`sessionId_${chatPath}`, sid);
        }
        
        let eid = localStorage.getItem(`executionId_${chatPath}`);
         if (!eid) {
            eid = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem(`executionId_${chatPath}`, eid);
        }

        setSessionId(sid);
        setExecutionId(eid);
    }
    getSessionInfo();
  }, [chatPath]);


  useEffect(() => {
    if (chatPath) {
      setIsLoading(true);
      fetch(`/api/assistants/public?chatPath=${encodeURIComponent(chatPath)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Asistente no encontrado o no disponible.');
          }
          return res.json();
        })
        .then(data => {
          if(!data.assistant) throw new Error('Asistente no encontrado.');
          setAssistant(data.assistant);
          setMessages([{
            text: `¡Hola! Estás chateando con ${data.assistant.name}. ¿Cómo puedo ayudarte hoy?`,
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        })
        .catch(err => {
            setError(err.message);
            setAssistant({ name: "Asistente no encontrado" });
             setMessages([{
                text: `Error: ${err.message}. No se pudo cargar el asistente.`,
                isUser: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             }]);
        })
        .finally(() => setIsLoading(false));
    }

    // Cleanup polling on component unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };

  }, [chatPath]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pollForResponse = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const RESPONSE_API_URL = `https://control.reptitalz.cloud/api/events?executionId=${executionId}`;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(RESPONSE_API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const events = await response.json();
          if (Array.isArray(events)) {
             const responseEvent = events.find(e => e.type === 'Respuesta' && !processedEventIds.has(e.id));
             if (responseEvent) {
                const aiResponse = {
                    text: responseEvent.data.message,
                    isUser: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, aiResponse]);
                setProcessedEventIds(prev => new Set(prev).add(responseEvent.id));
                setIsSending(false);
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
             }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }, [executionId, processedEventIds]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isSending || error || !assistant?.id) return;

    const userMessage = {
      text: currentMessage,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsSending(true);

    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assistantId: assistant.id,
                chatPath: assistant.chatPath,
                message: messageToSend,
                executionId: executionId,
                destination: sessionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'No se pudo enviar el mensaje.');
        }

        // Start polling for the response
        pollForResponse();

    } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
        // Restore message to input if sending fails
        setCurrentMessage(messageToSend);
        // Remove the message from chat history
        setMessages(prev => prev.slice(0, -1));
        setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-muted"><LoadingSpinner size={40} /></div>;
  }
  
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="w-full h-full flex">
        {/* Sidebar (Chat List Mockup) */}
        <div className="w-1/3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
            <header className="p-3 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                <Input placeholder="Buscar o empezar un chat nuevo" className="bg-white dark:bg-slate-700"/>
            </header>
            <div className="flex-grow overflow-y-auto">
                {/* Mock chat item */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={assistant?.imageUrl} alt={assistant?.name} />
                        <AvatarFallback>{assistant?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                        <p className="font-semibold truncate">{assistant?.name}</p>
                         <p className="text-sm text-muted-foreground truncate">
                          {isSending ? "Escribiendo..." : "en línea"}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Chat Window */}
        <div className="w-full md:w-2/3 flex flex-col bg-slate-200 dark:bg-slate-800">
           <div
            className="w-full h-full chat-background"
          >
            <div className="h-full flex flex-col backdrop-blur-sm bg-black/10">
              <header className="bg-[#008069] dark:bg-slate-800 text-white p-3 flex items-center shadow-md z-10 shrink-0">
                 <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 hover:bg-white/10" asChild>
                   <Link href="/dashboard/assistants"><FaArrowLeft /></Link>
                 </Button>
                <Avatar className="h-10 w-10 mr-3 border-2 border-white/50">
                    <AvatarImage src={assistant?.imageUrl} alt={assistant?.name} />
                    <AvatarFallback>{assistant?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base">{assistant?.name || 'Asistente'}</h3>
                  <p className="text-xs opacity-80">{error ? 'no disponible' : 'en línea'}</p>
                </div>
              </header>
              <main className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                  <ChatBubble key={index} text={msg.text} isUser={msg.isUser} time={msg.time} />
                ))}
                 {isSending && (
                    <div className="flex justify-start animate-fadeIn">
                        <div className="rounded-lg px-4 py-2 max-w-[80%] shadow-md bg-white dark:bg-slate-700">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                 )}
                <div ref={chatEndRef} />
              </main>
              <footer className="p-3 bg-slate-200 dark:bg-slate-800 flex items-center gap-3 shrink-0 border-t border-black/10">
                <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder={error ? "Chat no disponible" : "Escribe un mensaje..."}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    className="bg-white dark:bg-slate-700 rounded-full flex-1 border-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-base"
                    autoComplete="off"
                    disabled={!!error || isSending}
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-[#008069] dark:bg-primary hover:bg-[#006a58] dark:hover:bg-primary/90 h-11 w-11" disabled={isSending || !currentMessage.trim() || !!error}>
                    <FaPaperPlane className="h-5 w-5" />
                  </Button>
                </form>
              </footer>
            </div>
             <div className="absolute bottom-1 right-1/2 translate-x-1/2 text-[9px] text-muted-foreground/50 pointer-events-none">
                Powered by {APP_NAME}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopChatPage;
