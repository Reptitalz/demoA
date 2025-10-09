// src/app/chat/conversation/[chatPath]/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaPaperPlane, FaLock, FaUser, FaPaperclip, FaTags, FaMapMarkerAlt, FaImage, FaMicrophone, FaTrashAlt, FaVideo, FaFileAlt, FaPhone, FaCheck } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { AssistantConfig, ChatMessage, Product, UserProfile, Contact } from '@/types';
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import BusinessInfoSheet from '@/components/chat/BusinessInfoSheet';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/providers/AppProvider';
import ProductCatalogDialog from '@/components/chat/ProductCatalogDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { openDB } from '@/lib/db';
import { Loader2 } from 'lucide-react';
import { useSocket } from '@/providers/SocketProvider';


const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 4;
const MESSAGES_STORE_NAME = 'messages';
const SESSION_STORE_NAME = 'session';

// --- IndexedDB Helper Functions ---

const getSessionIdFromDB = async (chatPath: string): Promise<string | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE_NAME, 'readonly');
    const store = tx.objectStore(SESSION_STORE_NAME);
    const request = store.get(chatPath);
    request.onsuccess = () => {
      resolve(request.result?.sessionId || null);
    };
    request.onerror = (event) => {
      console.error("Error getting session from DB:", request.error);
      reject(request.error);
    };
  });
};

const setSessionIdInDB = async (chatPath: string, sessionId: string) => {
  const db = await openDB();
  const tx = db.transaction(SESSION_STORE_NAME, 'readwrite');
  tx.objectStore(SESSION_STORE_NAME).put({ chatPath, sessionId });
  return tx.done;
};

const getMessagesFromDB = async (sessionId: string): Promise<ChatMessage[]> => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
        const store = tx.objectStore(MESSAGES_STORE_NAME);
        const index = store.index('by_sessionId');
        const request = index.getAll(sessionId);
        request.onsuccess = () => {
            resolve(request.result || []);
        };
        request.onerror = () => resolve([]);
    });
};

const saveMessageToDB = async (message: ChatMessage, sessionId: string) => {
    const db = await openDB();
    const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
    // Add sessionId to the message object before storing
    tx.objectStore(MESSAGES_STORE_NAME).add({ ...message, sessionId });
    return tx.done;
};

// --- Component ---

const ChatBubble = ({ message, assistant, onImageClick }: { message: ChatMessage; assistant: AssistantConfig | null; onImageClick: (url: string) => void; }) => {
    const isUserMessage = message.role === 'user';
    const isGoogleMapsImage = typeof message.content === 'string' && message.content.includes('maps.googleapis.com/maps/api/staticmap');

    return (
        <div className={cn("flex w-full max-w-lg mx-auto", isUserMessage ? "justify-end" : "justify-start")}>
            <div className={cn("flex items-end gap-2", isUserMessage && "flex-row-reverse")}>
                {!isUserMessage && (
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={assistant?.imageUrl} />
                        <AvatarFallback>{assistant?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
                <div
                    className={cn(
                        "rounded-xl max-w-xs md:max-w-md shadow-md text-sm leading-relaxed relative",
                        isUserMessage
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card rounded-bl-none",
                        isGoogleMapsImage ? "p-1" : "px-3 py-2"
                    )}
                >
                    {typeof message.content === 'string' ? (
                        isGoogleMapsImage ? (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${message.content.split('center=')[1]?.split('&')[0]}`} target="_blank" rel="noopener noreferrer">
                                <Image src={message.content} alt="Ubicación en mapa" width={250} height={200} className="rounded-lg cursor-pointer" />
                            </a>
                        ) : (
                            <p className="pb-4">{message.content}</p>
                        )
                    ) : message.content.type === 'image' ? (
                        <div className="cursor-pointer" onClick={() => onImageClick(message.content.url)}>
                            <Image
                                src={message.content.url}
                                alt="Imagen enviada"
                                width={200}
                                height={200}
                                className="rounded-md"
                            />
                        </div>
                    ) : message.content.type === 'audio' ? (
                        <audio controls src={message.content.url} className="w-full max-w-xs" />
                    ) : null}
                    <div className="absolute bottom-1 right-2 flex items-center gap-1">
                        <p className={cn("text-[10px]", isUserMessage ? "text-primary-foreground/70" : "text-muted-foreground/80")}>
                            {message.time}
                        </p>
                        {isUserMessage && (
                            <div className="relative w-4 h-4">
                                <FaCheck className="absolute left-0 h-3 w-3 text-sky-400" />
                                <FaCheck className="absolute left-1 h-3 w-3 text-sky-400" />
                            </div>
                        )}
                    </div>
                </div>
                 {isUserMessage && (
                    <Avatar className="h-6 w-6">
                        <AvatarFallback><FaUser /></AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    );
};

const DesktopChatPage = () => {
  const params = useParams();
  const chatPath = params.chatPath as string;
  const router = useRouter();
  const { state } = useApp();
  const { userProfile, contacts } = state;
  const { socket } = useSocket();
  const { toast } = useToast();
  
  const [chatPartner, setChatPartner] = useState<AssistantConfig | UserProfile | Contact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [processedEventIds, setProcessedEventIds] = useState<Set<string>>(new Set());
  const [assistantStatusMessage, setAssistantStatusMessage] = useState<string>('en línea');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(true);
  
  const isPersonalChat = chatPartner && 'email' in chatPartner;
  const isAssistantChat = chatPartner && 'prompt' in chatPartner;

  const assistant = isAssistantChat ? (chatPartner as AssistantConfig) : null;

  const setupSessionAndMessages = useCallback(async () => {
    if (!chatPath) return null;
    try {
        let sid = await getSessionIdFromDB(chatPath);
        if (!sid) {
            sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            await setSessionIdInDB(chatPath, sid);
        }
        setSessionId(sid);
        
        const storedMessages = await getMessagesFromDB(sid);
        setMessages(storedMessages);
        return { sid, storedMessages };
    } catch(err) {
        console.error("Error setting up session:", err);
        setError("Error al iniciar la base de datos del chat. Por favor, intenta recargar la página.");
        setIsLoadingAssistant(false);
        return null;
    }
  }, [chatPath]);

    // WebSocket listener for incoming messages
  useEffect(() => {
    if (!socket || !isPersonalChat) return;

    const handleNewMessage = (message: any) => {
        // Only process if the message is for the current chat
        if (message.senderChatPath === chatPath) {
             const receivedMessage: ChatMessage = {
                role: 'model', // It's from the other person, so we show it as 'model'
                content: message.content,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, receivedMessage]);
            saveMessageToDB(receivedMessage, sessionId);
        }
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket, isPersonalChat, chatPath, sessionId]);


 useEffect(() => {
    if (!chatPath || !userProfile.isAuthenticated) {
        setIsLoadingAssistant(false);
        return;
    }

    let isMounted = true;
    setIsLoadingAssistant(true);

    const loadChat = async () => {
        const sessionData = await setupSessionAndMessages();
        if (!isMounted || !sessionData) return;

        const { sid, storedMessages } = sessionData;

        // Determine if the chat partner is an assistant or another user/contact
        const partner =
            userProfile.assistants.find(a => a.chatPath === chatPath) ||
            contacts.find(c => c.chatPath === chatPath);
        
        if (partner) {
            setChatPartner(partner);
            setError(null);
            
             // Set up initial message if it's a new chat
            if (storedMessages.length === 0) {
                 const initialMessageContent = partner && 'prompt' in partner
                    ? `¡Hola! Estás chateando con ${(partner as AssistantConfig).name}. ¿Cómo puedo ayudarte hoy?`
                    : `Inicia tu conversación con ${partner.name}.`;

                const initialMessage: ChatMessage = {
                    role: 'model',
                    content: initialMessageContent,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages([initialMessage]);
                saveMessageToDB(initialMessage, sid);
            }
        } else {
             setError("No se encontró el chat. Es posible que el contacto ya no exista o la URL sea incorrecta.");
        }
        setIsLoadingAssistant(false);
    };

    loadChat();

    return () => { isMounted = false; };
}, [chatPath, userProfile.isAuthenticated, userProfile.assistants, contacts, setupSessionAndMessages]);


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
              setAssistantStatusMessage('en línea'); // Reset status
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
  
  const sendMessageToServer = useCallback(async (messageContent: string | { type: 'image' | 'audio' | 'video' | 'document'; url: string, name?: string }) => {
    if (!assistant?.chatPath) {
        return;
    }
    
    if (isPersonalChat) {
        if (socket && typeof messageContent === 'string') {
            socket.emit('sendMessage', {
                senderId: userProfile._id,
                senderChatPath: userProfile.chatPath,
                recipientChatPath: chatPartner?.chatPath,
                content: messageContent,
            });
        }
        return; // Don't proceed to the rest of the function for personal chats
    }

    // Add image/audio responses here for non-personal chats
    if (typeof messageContent !== 'string' && (messageContent.type === 'image' || messageContent.type === 'audio')) {
        const responseText = messageContent.type === 'image' 
            ? "Recibí tu imagen. Será verificada por el propietario y pronto te daré una respuesta."
            : "Recibí tu audio. Lo revisaré y te daré una respuesta.";
            
        const modelResponse: ChatMessage = {
            role: 'model',
            content: responseText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, modelResponse]);
        await saveMessageToDB(modelResponse, sessionId);
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
        if (assistant.type === 'desktop' && typeof messageContent === 'string') {
            pollForResponse();
        }
    }).catch(err => {
        console.error("Error sending message to proxy:", err);
    });
  }, [assistant?.id, assistant?.chatPath, assistant?.type, sessionId, pollForResponse, toast, isPersonalChat, socket, userProfile, chatPartner?.chatPath]);


  const handleSendMessage = async (e?: React.FormEvent, messageOverride?: string) => {
    if (e) e.preventDefault();
    const messageToSend = messageOverride || currentMessage;
    
    if (!messageToSend.trim() || isSending) return;
    
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

    // Don't show "Escribiendo..." for personal chats, as it's real-time
    if (!isPersonalChat) {
      setIsSending(true);
      setAssistantStatusMessage('Escribiendo...');
    }

    sendMessageToServer(messageToSend);
  };
  
 const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isSending) return;

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

  const handleSendLocation = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Geolocalización no soportada",
        description: "Tu navegador no permite obtener la ubicación.",
        variant: "destructive",
      });
      return;
    }
  
    setIsSending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=250x200&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
        handleSendMessage(undefined, mapsUrl);
        setIsSending(false);
      },
      (error) => {
        toast({
          title: "Error de Ubicación",
          description: "No se pudo obtener tu ubicación. Por favor, asegúrate de tener los permisos activados.",
          variant: "destructive",
        });
        setIsSending(false);
      }
    );
  };
  
    // Audio Recording Handlers
  const startRecording = async () => {
    if (isRecording || !navigator.mediaDevices?.getUserMedia) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        recordingStartTimeRef.current = Date.now();
        recordingTimerRef.current = setInterval(() => {
            if (recordingStartTimeRef.current) {
                setRecordingTime(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
            }
        }, 1000);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({
            title: "Error de Micrófono",
            description: "No se pudo acceder al micrófono. Asegúrate de tener los permisos activados.",
            variant: "destructive",
        });
    }
  };

  const stopRecordingAndSend = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

      mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);

          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              
              const audioMessage: ChatMessage = {
                  role: 'user',
                  content: { type: 'audio', url: base64Audio },
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };

              setMessages(prev => [...prev, audioMessage]);
              await saveMessageToDB(audioMessage, sessionId);
              sendMessageToServer({ type: 'audio', url: base64Audio });
          };
          reader.readAsDataURL(audioBlob);

          // Cleanup
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
  };
  
   const cancelRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
      toast({ title: 'Grabación Cancelada' });
  };
  
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'document') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25 MB

        if (type === 'document' && file.size > MAX_DOC_SIZE) {
            toast({ title: "Archivo demasiado grande", description: "El documento no puede exceder los 25MB.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            const fileMessageContent = { type, url: dataUrl, name: file.name };
            
            const userMessage: ChatMessage = {
                role: 'user',
                content: fileMessageContent,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, userMessage]);
            await saveMessageToDB(userMessage, sessionId);
            sendMessageToServer(fileMessageContent);
        };
        reader.readAsDataURL(file);

        if (event.target) event.target.value = '';
    };

  const showProductsButton = assistant?.catalogId && state.userProfile.catalogs?.some(c => c.id === assistant.catalogId);
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-sm text-foreground p-3 flex items-center shadow-md z-20 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8 mr-2" onClick={() => router.push('/chat/dashboard')}>
            <FaArrowLeft />
        </Button>
        {isLoadingAssistant ? (
            <div className="flex items-center gap-3 flex-grow">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-1">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-3 flex-grow overflow-hidden">
                <Avatar className="h-10 w-10 border-2 border-primary/50 cursor-pointer" onClick={() => assistant && setIsInfoSheetOpen(true)}>
                    <AvatarImage src={chatPartner?.imageUrl} alt={chatPartner?.name} />
                    <AvatarFallback>{chatPartner?.name ? chatPartner.name.charAt(0) : <FaUser />}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden flex-grow cursor-pointer" onClick={() => assistant && setIsInfoSheetOpen(true)}>
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-base truncate text-foreground">{chatPartner?.name || 'Asistente'}</h3>
                        {isAssistantChat && (assistant as AssistantConfig).accountType === 'business' && (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                                    <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                                    <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                                </svg>
                            </Badge>
                        )}
                        {isAssistantChat && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>
                        )}
                    </div>
                    <p className="text-xs text-green-500 font-medium">
                       {assistantStatusMessage}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {isPersonalChat && (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => router.push(`/chat/call/${chatPath}?type=video`)}>
                                <FaVideo />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => router.push(`/chat/call/${chatPath}?type=audio`)}>
                                <FaPhone />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        )}
    </header>
    <main className="flex-1 overflow-y-auto relative pt-20">
        <div className="absolute inset-x-0 top-16 bottom-0 chat-background" />
        <div className="relative z-[1] p-4 flex flex-col gap-2 pb-28">
        {messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} assistant={assistant} onImageClick={setSelectedImage} />
        ))}
        {isSending && isAssistantChat && (
            <div className="flex justify-start animate-fadeIn max-w-lg mx-auto">
                <div className="flex items-end gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={assistant?.imageUrl} />
                        <AvatarFallback>{assistant?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="rounded-2xl px-4 py-2 max-w-xs shadow-md bg-card rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
        </div>
    </main>
      
       {isRecording && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-20 flex flex-col items-center justify-center"
            >
                <FaMicrophone className="h-16 w-16 text-white animate-pulse" />
                <p className="text-white mt-4 font-mono text-2xl">
                    {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                    {(recordingTime % 60).toString().padStart(2, '0')}
                </p>
                 <div className="absolute bottom-12 flex items-center text-white/70">
                    <FaTrashAlt className="mr-2"/>
                    <span>Desliza para cancelar</span>
                </div>
            </motion.div>
        )}

      <div className="fixed bottom-0 left-0 right-0 z-10">
        <footer className="p-3 bg-background/80 backdrop-blur-sm flex items-center gap-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full h-11 w-11 text-muted-foreground hover:text-primary"
                    disabled={isSending}
                >
                    <FaPaperclip className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="mb-2">
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <FaImage className="mr-2" />
                Enviar Imagen
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => videoInputRef.current?.click()}>
                <FaVideo className="mr-2" />
                Enviar Video
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => documentInputRef.current?.click()}>
                <FaFileAlt className="mr-2" />
                Enviar Documento
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSendLocation}>
                <FaMapMarkerAlt className="mr-2" />
                Enviar Ubicación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
            <Input
                type="text"
                placeholder={isAssistantChat && !assistant?.isActive ? "El asistente IA está desactivado" : "Escribe un mensaje..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="bg-card rounded-full flex-1 border-none focus-visible:ring-1 focus-visible:ring-primary h-11 text-base"
                autoComplete="off"
                disabled={isSending || (isAssistantChat && !assistant?.isActive)}
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/jpeg, image/png, image/webp"
            />
            <input
                type="file"
                ref={videoInputRef}
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
                accept="video/*"
            />
            <input
                type="file"
                ref={documentInputRef}
                onChange={(e) => handleFileUpload(e, 'document')}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            {currentMessage.trim() ? (
                <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 h-11 w-11" disabled={isSending || !currentMessage.trim() || (isAssistantChat && !assistant?.isActive)}>
                    <FaPaperPlane className="h-5 w-5" />
                </Button>
            ) : (
                 <Button 
                    type="button" 
                    size="icon" 
                    className="rounded-full bg-primary hover:bg-primary/90 h-11 w-11" 
                    disabled={isSending || (isAssistantChat && !assistant?.isActive)}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecordingAndSend}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecordingAndSend}
                >
                    <FaMicrophone className="h-5 w-5" />
                </Button>
            )}
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
          onProductSelect={(product: Product) => {
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
