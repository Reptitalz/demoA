
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const { userProfile, contacts } = state;
  const { toast } = useToast();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{ roomName: string; callerId: string; callerInfo: any } | null>(null);

  const handleReceiveMessage = useCallback((message: any, ack: (data: { delivered: boolean }) => void) => {
    // Acknowledge receipt of the message
    if (ack) {
      ack({ delivered: true });
    }

    // Check if sender is already a contact
    const senderIsContact = contacts.some(c => c.chatPath === message.senderChatPath);

    // If not a contact, add them automatically
    if (!senderIsContact && message.senderProfile) {
        const newContact: Contact = {
            chatPath: message.senderChatPath,
            name: message.senderProfile.name || 'Nuevo Contacto',
            imageUrl: message.senderProfile.imageUrl,
            conversationSize: 0, // Initial size
        };
        dispatch({ type: 'ADD_CONTACT', payload: newContact });
        toast({
            title: "Nuevo Contacto",
            description: `Has sido añadido por ${newContact.name}. Ahora puedes chatear.`,
        });
    }

    // Update last message preview in the contact list
    dispatch({
        type: 'SET_CONTACTS',
        payload: contacts.map(c => 
            c.chatPath === message.senderChatPath
            ? { ...c, lastMessage: message.content, lastMessageTimestamp: Date.now() }
            : c
        ).sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0))
    });

  }, [contacts, dispatch, toast]);

  useEffect(() => {
    if (userProfile.isAuthenticated && userProfile.chatPath) {
        const newSocket = io(SOCKET_SERVER_URL, {
            query: { userId: userProfile.chatPath } // Use chatPath to join room
        });
        
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log(`Connected to WebSocket server and joined room: ${userProfile.chatPath}`);
        });

        newSocket.on('incomingCall', (data) => {
            setIncomingCall(data);
        });
        
        newSocket.on('receiveMessage', handleReceiveMessage);

        newSocket.on('callRejected', ({ callerId }) => {
            if(userProfile._id?.toString() === callerId) {
                toast({ title: "Llamada Rechazada", description: "El usuario ha rechazado la llamada." });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        return () => {
            newSocket.disconnect();
        };
    }
  }, [userProfile.isAuthenticated, userProfile.chatPath, toast, handleReceiveMessage]);
  
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
