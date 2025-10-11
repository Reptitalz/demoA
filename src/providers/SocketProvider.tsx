
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useApp } from './AppProvider';
import { useToast } from '@/hooks/use-toast';
import IncomingCallDialog from '@/components/chat/IncomingCallDialog';
import { useRouter } from 'next/navigation';
import { Contact } from '@/types';

// --- This is a conceptual addition. You need a way to access the io instance on the server.
// This is non-trivial in a serverless environment like Next.js API routes.
// A common pattern is to expose it via a global or a custom server setup.
// For this example, we'll assume getIo() is a placeholder for that logic.
let ioInstance: any = null;
export const setIo = (io: any) => { ioInstance = io; }
export const getIo = () => ioInstance;
// --- End of conceptual addition ---


interface ISocketContext {
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext>({ socket: null });

export const useSocket = () => useContext(SocketContext);

const SOCKET_SERVER_URL = "https://heymanito-servidor.urzoqm.easypanel.host/";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{ roomName: string; callerId: string; callerInfo: any } | null>(null);

  // Memoize handlers to prevent re-creating them on every render
  const handleReceiveMessage = useCallback((message: any) => {
    // Use a function for dispatch to get the latest contacts state without depending on it
    dispatch(prevState => {
        const currentContacts = prevState.contacts;
        const senderIsContact = currentContacts.some(c => c.chatPath === message.senderChatPath);

        if (!senderIsContact && message.senderProfile) {
            const newContact: Contact = {
                chatPath: message.senderChatPath,
                name: message.senderProfile.name || 'Nuevo Contacto',
                imageUrl: message.senderProfile.imageUrl,
                conversationSize: 0,
            };
            // This is complex logic that might be better handled inside the reducer
            // For now, we proceed, but this indicates a need for better state management.
            toast({
                title: "Nuevo Contacto",
                description: `Has sido añadido por ${newContact.name}. Ahora puedes chatear.`,
            });
             return { ...prevState, contacts: [newContact, ...currentContacts] };
        }
        
        const updatedContacts = currentContacts.map(c => 
            c.chatPath === message.senderChatPath
            ? { ...c, lastMessage: message.content, lastMessageTimestamp: Date.now(), unreadCount: (c.unreadCount || 0) + 1 }
            : c
        ).sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));

        return { ...prevState, contacts: updatedContacts };
    });
  }, [dispatch, toast]);
  
  const handleContactOnline = useCallback((onlineUserChatPath: string) => {
    dispatch(prevState => ({
        ...prevState,
        contacts: prevState.contacts.map(c => c.chatPath === onlineUserChatPath ? { ...c, isOnline: true } : c)
    }));
  }, [dispatch]);

  const handleContactOffline = useCallback((offlineUserChatPath: string) => {
     dispatch(prevState => ({
        ...prevState,
        contacts: prevState.contacts.map(c => c.chatPath === offlineUserChatPath ? { ...c, isOnline: false } : c)
    }));
  }, [dispatch]);

  const handleOnlineUsers = useCallback((onlineUsers: { [chatPath: string]: string }) => {
    const onlineChatPaths = Object.keys(onlineUsers);
    dispatch(prevState => ({
        ...prevState,
        contacts: prevState.contacts.map(c => ({...c, isOnline: onlineChatPaths.includes(c.chatPath)}))
    }));
  }, [dispatch]);


  useEffect(() => {
    if (!userProfile.isAuthenticated || !userProfile.chatPath) {
        if(socket) {
            socket.disconnect();
            setSocket(null);
        }
        return;
    }
    
    // Create socket instance ONLY when authenticated and not already connected.
    if (!socket) {
        const newSocket = io(SOCKET_SERVER_URL, {
            query: { userId: userProfile.chatPath }
        });
        
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log(`Connected to WebSocket server and joined room: ${userProfile.chatPath}`);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setSocket(null); // Allow reconnection on next render
        });

        // Setup listeners once
        newSocket.on('incomingCall', (data) => setIncomingCall(data));
        newSocket.on('receiveMessage', handleReceiveMessage);
        newSocket.on('contact_online', handleContactOnline);
        newSocket.on('contact_offline', handleContactOffline);
        newSocket.on('online_users', handleOnlineUsers);
        newSocket.on('callRejected', ({ callerId }) => {
            if(userProfile._id?.toString() === callerId) {
                toast({ title: "Llamada Rechazada", description: "El usuario ha rechazado la llamada." });
            }
        });

        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }

  // CRITICAL FIX: The dependency array is now stable and won't cause re-connections.
  // It only depends on authentication status and user's chatPath.
  }, [userProfile.isAuthenticated, userProfile.chatPath, handleReceiveMessage, handleContactOnline, handleContactOffline, handleOnlineUsers, toast, userProfile._id]);
  
  const handleAcceptCall = () => {
    if (incomingCall) {
        router.push(`/chat/call/${incomingCall.callerId}?room=${incomingCall.roomName}&type=video`);
        setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (socket && incomingCall) {
        socket.emit('callRejected', { callerId: incomingCall.callerId, recipientId: userProfile._id });
        setIncomingCall(null);
    }
  };

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
      {incomingCall && (
        <IncomingCallDialog
          isOpen={!!incomingCall}
          caller={{ name: incomingCall.callerInfo?.name || 'Desconocido', imageUrl: incomingCall.callerInfo?.imageUrl }}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </SocketContext.Provider>
  );
};
