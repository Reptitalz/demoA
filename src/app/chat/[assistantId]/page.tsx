// src/app/chat/[assistantId]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  const assistantId = params.assistantId as string;
  const [assistant, setAssistant] = useState<Partial<AssistantConfig> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string, isUser: boolean, time: string }[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (assistantId) {
      fetch(`/api/assistants/public/${assistantId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Asistente no encontrado o no disponible.');
          }
          return res.json();
        })
        .then(data => {
          setAssistant(data);
          // Add a welcome message from the assistant
          setMessages([{
            text: `¡Hola! Estás chateando con ${data.name}. ¿Cómo puedo ayudarte hoy?`,
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [assistantId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isSending) return;

    const userMessage = {
      text: currentMessage,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsSending(true);

    // Placeholder for AI response
    setTimeout(() => {
      const aiResponse = {
        text: "Esta es una respuesta simulada del asistente. La lógica de IA real se implementará aquí.",
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsSending(false);
    }, 1500);

  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-muted"><LoadingSpinner size={40} /></div>;
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-muted text-center p-4">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/dashboard/assistants">Volver al Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-muted/50 dark:bg-slate-800">
      <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2rem] h-[calc(100%-2rem)] w-full max-w-lg shadow-xl my-4">
        <div className="rounded-[1.5rem] overflow-hidden w-full h-full bg-[#ECE5DD] dark:bg-slate-900">
          <div
            className="bg-repeat bg-center h-full"
            style={{ backgroundImage: "url('/whatsapp_bg.png')" }}
          >
            <div className="h-full flex flex-col">
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
                  <p className="text-xs opacity-80">en línea</p>
                </div>
              </header>
              <main className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                  <ChatBubble key={index} text={msg.text} isUser={msg.isUser} time={msg.time} />
                ))}
                 {isSending && (
                    <div className="flex justify-start">
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
              <footer className="p-3 bg-transparent flex items-center gap-3 shrink-0 border-t border-black/10">
                <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    className="bg-white dark:bg-slate-700 rounded-full flex-1 border-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-base"
                    autoComplete="off"
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-[#008069] dark:bg-primary hover:bg-[#006a58] dark:hover:bg-primary/90 h-11 w-11" disabled={isSending || !currentMessage.trim()}>
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
