
// src/app/chat/[chatPath]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FaArrowLeft, FaPaperPlane, FaLock, FaUser, FaPaperclip, FaCreditCard, FaTags } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AssistantConfig, ChatMessage } from '@/types';
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import BusinessInfoSheet from '@/components/chat/BusinessInfoSheet';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/providers/AppProvider';
import ProductCatalogDialog from '@/components/chat/ProductCatalogDialog';


const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 1;
const MESSAGES_STORE_NAME = 'messages';
const SESSION_STORE_NAME = 'session';

// --- IndexedDB Helper Functions ---

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
        db.createObjectStore(MESSAGES_STORE_NAME, { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
        db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'chatPath' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getSessionIdFromDB = async (chatPath: string): Promise<string | null> => {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(SESSION_STORE_NAME, 'readonly');
    const store = tx.objectStore(SESSION_STORE_NAME);
    const request = store.get(chatPath);
    request.onsuccess = () => {
      resolve(request.result?.sessionId || null);
    };
    request.onerror = () => resolve(null);
  });
};

const setSessionIdInDB = async (chatPath: string, sessionId: string) => {
  const db = await openDB();
  const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
  tx.objectStore(SESSION_STORE_NAME).put({ chatPath, sessionId });
  return tx.complete;
};

const getMessagesFromDB = async (sessionId: string): Promise<ChatMessage[]> => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
        const store = tx.objectStore(MESSAGES_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            // Filter messages by sessionId on the client side
            const allMessages = request.result as (ChatMessage & { sessionId: string })[];
            const sessionMessages = allMessages.filter(msg => msg.sessionId === sessionId);
            resolve(sessionMessages);
        };
        request.onerror = () => resolve([]);
    });
};

const saveMessageToDB = async (message: ChatMessage, sessionId: string) => {
    const db = await openDB();
    const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
    // Add sessionId to the message object before storing
    tx.objectStore(MESSAGES_STORE_NAME).add({ ...message, sessionId });
    return tx.complete;
};

// --- Component ---

const ChatBubble = ({ message, onImageClick }: { message: ChatMessage; onImageClick: (url: string) => void; }) => (
    <div className={cn("flex mb-2.5 animate-fadeIn", message.role === 'user' ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-xl px-4 py-2.5 max-w-[85%] shadow-md text-sm leading-relaxed",
          message.role === 'user'
            ? "bg-primary text-primary-foreground"
            : "bg-card/80 text-card-foreground"
        )}
      >
        {typeof message.content === 'string' ? (
          <p>{message.content}</p>
        ) : (
          message.content.type === 'image' && (
            <div className="cursor-pointer" onClick={() => onImageClick(message.content.url)}>
                <Image
                src={message.content.url}
                alt="Imagen enviada"
                width={200}
                height={200}
                className="rounded-md"
                />
            </div>
          )
        )}
        <p className="text-xs text-right mt-1.5 text-muted-foreground">{message.time}</p>
      </div>
    </div>
  );

const DesktopChatPage = () => {
  const params = useParams();
  const { state } = useApp();
  const { toast } = useToast();
  const chatPath = params.chatPath as string;
  const [assistant, setAssistant] = useState<AssistantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());
  const [assistantStatusMessage, setAssistantStatusMessage] = useState<string>('Escribiendo...');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const setupSessionAndMessages = async () => {
      if (!chatPath) return;

      let sid = await getSessionIdFromDB(chatPath);
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await setSessionIdInDB(chatPath, sid);
      }
      setSessionId(sid);
      
      const storedMessages = await getMessagesFromDB(sid);
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      }
    };
    setupSessionAndMessages();
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
          if (messages.length === 0) { // Only set initial message if chat is empty
            const initialMessage = {
              role: 'model' as const,
              content: `¡Hola! Estás chateando con ${data.assistant.name}. ¿Cómo puedo ayudarte hoy?`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages([initialMessage]);
            if (sessionId) saveMessageToDB(initialMessage, sessionId);
          }
        })
        .catch(err => {
            setError(err.message);
            setAssistant({ name: "Asistente no encontrado" } as AssistantConfig);
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
  }, [chatPath, sessionId]); // Re-run when sessionId is available

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const pollForResponse = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    if (!assistant?.id) return;

    const EVENTS_API_URL = `https://control.reptitalz.cloud/api/events?destination=${sessionId}`;
    
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
                 const aiResponse: ChatMessage = {
                  role: 'model' as const,
                  content: responseText,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, aiResponse]);
                saveMessageToDB(aiResponse, sessionId);
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
  }, [assistant?.id, processedEventIds, sessionId]);
  
  const sendMessageToServer = useCallback(async (messageContent: string | { type: 'image'; url: string }) => {
    if (!assistant?.id || !assistant?.chatPath || !sessionId) return;
    
    // Add image responses here
    if (typeof messageContent !== 'string' && messageContent.type === 'image') {
        const imageResponse: ChatMessage = {
            role: 'model',
            content: "Recibí tu imagen. Será verificada por el propietario y pronto te daré una respuesta.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, imageResponse]);
        await saveMessageToDB(imageResponse, sessionId);
    }
    
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
        // Only start polling for text messages
        if(assistant.isActive && typeof messageContent === 'string') {
            pollForResponse();
        }
    }).catch(err => {
        console.error("Error sending message to proxy:", err);
    });
  }, [assistant?.id, assistant?.chatPath, assistant?.isActive, sessionId, pollForResponse]);


  const handleSendMessage = async (e?: React.FormEvent, messageOverride?: string) => {
    if (e) e.preventDefault();
    const messageToSend = messageOverride || currentMessage;
    
    if (!messageToSend.trim() || isSending || error) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessageToDB(userMessage, sessionId);
    
    if (!messageOverride) {
      setCurrentMessage('');
    }

    if (assistant?.isActive) {
        setIsSending(true);
        setAssistantStatusMessage('Escribiendo...');
    }

    sendMessageToServer(messageToSend);
  };
  
 const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isSending || error) return;

    const MAX_SIZE = 800; // Max width/height 800px
    const QUALITY = 0.7; // 70% JPEG quality

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
            
            const imageMessageContent = { type: 'image' as const, url: dataUrl };
      
            const userMessage: ChatMessage = {
                role: 'user',
                content: imageMessageContent,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, userMessage]);
            await saveMessageToDB(userMessage, sessionId);
            
            setIsSending(false); // Do not show spinner for images
            
            sendMessageToServer(imageMessageContent);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  if (isLoading) {
    return <div className="h-full w-screen flex items-center justify-center bg-transparent"><LoadingSpinner size={40} /></div>;
  }
  
  const showCreditButton = assistant?.purposes?.includes('sell_credits');
  const showProductsButton = assistant?.purposes?.includes('sell_products');
  
  return (
    <>
      <div className="h-full w-screen flex flex-col bg-transparent">
        <header
          className="bg-card/80 backdrop-blur-sm text-foreground p-3 flex items-center shadow-md z-10 shrink-0 border-b"
        >
          <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 hover:bg-white/10" asChild>
            <Link href="/chat/dashboard"><FaArrowLeft /></Link>
          </Button>
          <Avatar className="h-10 w-10 mr-3 border-2 border-primary/50" onClick={() => setIsInfoSheetOpen(true)}>
              <AvatarImage src={assistant?.imageUrl} alt={assistant?.name} />
              <AvatarFallback>{assistant?.name ? assistant.name.charAt(0) : <FaUser />}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden flex-grow" onClick={() => setIsInfoSheetOpen(true)}>
            <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-base truncate">{assistant?.name || 'Asistente'}</h3>
                {state.userProfile.accountType === 'business' && (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                            <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                            <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                        </svg>
                    </Badge>
                )}
                {assistant?.isActive && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>
                )}
            </div>
            <p className="text-xs opacity-80">{error ? 'No disponible' : isSending ? assistantStatusMessage : 'en línea'}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
              {showCreditButton && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleSendMessage(undefined, 'Quiero solicitar un crédito')}><FaCreditCard className="mr-1.5"/> Crédito</Button>}
              {showProductsButton && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsCatalogOpen(true)}><FaTags className="mr-1.5"/> Productos</Button>}
          </div>
        </header>

        <main className="flex-1 p-4 overflow-y-auto pb-28">
          {messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} onImageClick={setSelectedImage} />
          ))}
          {isSending && (
              <div className="flex justify-start animate-fadeIn">
                  <div className="rounded-lg px-4 py-2 max-w-[80%] shadow-md bg-card">
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10">
        <footer className="p-3 bg-background/80 backdrop-blur-sm flex items-center gap-3 border-t">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-11 w-11 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !!error}
          >
            <FaPaperclip className="h-5 w-5" />
          </Button>
          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
            <Input
                type="text"
                placeholder={error ? "Chat no disponible" : "Escribe un mensaje..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="bg-card rounded-full flex-1 border-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-base"
                autoComplete="off"
                disabled={!!error || isSending}
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
            />
            <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 h-11 w-11" disabled={isSending || !currentMessage.trim() || !!error}>
                <FaPaperPlane className="h-5 w-5" />
            </Button>
          </form>
        </footer>
        <div className="bg-background/80 backdrop-blur-sm px-3 pb-2 flex justify-between items-center">
            <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <FaLock size={8} />
                <span>Los mensajes se guardan en este dispositivo.</span>
            </div>
            <div className="text-[9px] text-muted-foreground/50">
                Powered by {APP_NAME}
            </div>
        </div>
      </div>
      
      {assistant && (
        <BusinessInfoSheet
          assistant={assistant}
          isOpen={isInfoSheetOpen}
          onOpenChange={setIsInfoSheetOpen}
        />
      )}
      
      {assistant && (
        <ProductCatalogDialog
          isOpen={isCatalogOpen}
          onOpenChange={setIsCatalogOpen}
          assistant={assistant}
          onProductSelect={(product) => {
             handleSendMessage(undefined, `Hola, me interesa el producto: ${product.name} ($${product.price}).`);
             setIsCatalogOpen(false);
          }}
        />
      )}
      
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
            <DialogContent className="max-w-4xl p-0 border-0">
                <Image 
                    src={selectedImage}
                    alt="Vista detallada de la imagen"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-contain rounded-t-lg"
                />
                 <DialogFooter className="p-4 bg-background rounded-b-lg flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedImage(null)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DesktopChatPage;
