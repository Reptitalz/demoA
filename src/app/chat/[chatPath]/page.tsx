// src/app/chat/[chatPath]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AssistantConfig, ChatMessage } from '@/types';
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { useToast } from '@/hooks/use-toast';
import { Paperclip } from 'lucide-react';
import Image from 'next/image';

const ChatBubble = ({ message, isUser, time }: { message: ChatMessage; isUser: boolean; time: string }) => (
    <div className={cn("flex mb-2.5 animate-fadeIn", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-xl px-4 py-2.5 max-w-[85%] shadow-md text-sm leading-relaxed",
          isUser
            ? "bg-[#dcf8c6] dark:bg-[#054740] text-gray-800 dark:text-gray-100"
            : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100"
        )}
      >
        {typeof message.content === 'string' ? (
          <p>{message.content}</p>
        ) : (
          message.content.type === 'image' && (
            <Image
              src={message.content.url}
              alt="Imagen enviada"
              width={200}
              height={200}
              className="rounded-md"
            />
          )
        )}
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [sessionId, setSessionId] = useState<string>('');
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());
  const [assistantStatusMessage, setAssistantStatusMessage] = useState<string>('Escribiendo...');

  useEffect(() => {
    // Generate session ID on initial load if it doesn't exist.
    const getSessionId = () => {
        let sid = localStorage.getItem(`sessionId_${chatPath}`);
        if (!sid) {
            sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem(`sessionId_${chatPath}`, sid);
        }
        setSessionId(sid);
    }
    getSessionId();
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
            role: 'model',
            content: `¡Hola! Estás chateando con ${data.assistant.name}. ¿Cómo puedo ayudarte hoy?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        })
        .catch(err => {
            setError(err.message);
            setAssistant({ name: "Asistente no encontrado" });
             setMessages([{
                role: 'model',
                content: `Error: ${err.message}. No se pudo cargar el asistente.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
             }]);
        })
        .finally(() => setIsLoading(false));
    }

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
    if (!assistant?.id) return;

    const EVENTS_API_URL = `https://control.reptitalz.cloud/api/events?destination=${assistant.id}`;
    
    console.log("Polling for response at:", EVENTS_API_URL);

    const poll = async () => {
      try {
        const response = await fetch(EVENTS_API_URL);

        if (response.ok) {
          const events = await response.json();
          console.log("Received data from events API:", events);

          let foundFinalResponse = false;
          const newProcessedIds = new Set(processedEventIds);

          if (Array.isArray(events) && events.length > 0) {
            for (const event of events) {
              const eventId = event._id || event.id;
              if (!eventId || newProcessedIds.has(eventId)) continue;
              
              const responseText = event.output?.responseText;

              if (responseText) {
                 const aiResponse = {
                  role: 'model' as const,
                  content: responseText,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, aiResponse]);
                foundFinalResponse = true;
              } else if (event.output?.statusMessage) {
                setAssistantStatusMessage(event.output.statusMessage);
              }
              
              newProcessedIds.add(eventId);
            }
          }
          
          setProcessedEventIds(newProcessedIds);

          if (foundFinalResponse) {
              setIsSending(false);
              setAssistantStatusMessage('Escribiendo...'); // Reset status
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
          }
        } else {
          console.error('Polling request failed with status:', response.status);
           if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
        }
      } catch (err) {
        console.error('Polling error:', err);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };
    
    pollIntervalRef.current = setInterval(poll, 3000);
  }, [assistant?.id, processedEventIds]);
  
  const sendMessageToServer = useCallback((messageContent: string | { type: 'image'; url: string }) => {
    if (!assistant?.id || !assistant?.chatPath || !sessionId) return;
    
    fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            assistantId: assistant.id,
            message: messageContent,
            destination: sessionId,
            chatPath: assistant.chatPath,
        })
    }).then(response => {
        pollForResponse();
    }).catch(err => {
        console.error("Error sending message to proxy:", err);
    });
  }, [assistant?.id, assistant?.chatPath, sessionId, pollForResponse]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isSending || error) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setIsSending(true);
    setAssistantStatusMessage('Escribiendo...');

    sendMessageToServer(messageToSend);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isSending || error) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      const userMessage: ChatMessage = {
        role: 'user',
        content: { type: 'image', url: base64String },
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, userMessage]);
      setIsSending(true);
      setAssistantStatusMessage('Analizando imagen...');
      
      sendMessageToServer(base64String);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-muted"><LoadingSpinner size={40} /></div>;
  }
  
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="w-full h-full flex">
        {/* Sidebar Mockup */}
        <div className="w-1/3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
            <header className="p-3 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
                <Input placeholder="Buscar o empezar un chat nuevo" className="bg-white dark:bg-slate-700"/>
            </header>
            <div className="flex-grow overflow-y-auto">
                <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={assistant?.imageUrl} alt={assistant?.name} />
                        <AvatarFallback>{assistant?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                        <p className="font-semibold truncate">{assistant?.name}</p>
                         <p className="text-sm text-muted-foreground truncate">
                          {isSending ? assistantStatusMessage : "en línea"}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-full md:w-2/3 flex flex-col bg-slate-200 dark:bg-slate-800 relative">
           <div className="absolute inset-0 chat-background" />
            <div className="relative h-full flex flex-col">
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
                  <p className="text-xs opacity-80">{error ? 'no disponible' : isSending ? assistantStatusMessage : 'en línea'}</p>
                </div>
              </header>
              <main className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                  <ChatBubble key={index} message={msg} isUser={msg.role === 'user'} time={msg.time || ''} />
                ))}
                 {isSending && (
                    <div className="flex justify-start animate-fadeIn">
                        <div className="rounded-lg px-4 py-2 max-w-[80%] shadow-md bg-white dark:bg-slate-700">
                           <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                           </div>
                        </div>
                    </div>
                 )}
                <div ref={chatEndRef} />
              </main>
              <footer className="p-3 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center gap-3 shrink-0 border-t border-black/10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full h-11 w-11 text-muted-foreground hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || !!error}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
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
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
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
  );
};

export default DesktopChatPage;
