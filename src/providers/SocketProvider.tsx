
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useApp } from './AppProvider';
import { useToast } from '@/hooks/use-toast';
import IncomingCallDialog from '@/components/chat/IncomingCallDialog';
import { useRouter } from 'next/navigation';

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
  const { state } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{ roomName: string; callerId: string; callerInfo: any } | null>(null);

  useEffect(() => {
    if (userProfile.isAuthenticated && userProfile._id) {
        const newSocket = io(SOCKET_SERVER_URL, {
            query: { userId: userProfile._id.toString() }
        });
        
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            newSocket.emit('joinRoom', userProfile._id?.toString());
        });

        // Listen for incoming calls
        newSocket.on('incomingCall', (data) => {
            setIncomingCall(data);
        });

        // Listen for when the call is rejected by the other user
        newSocket.on('callRejected', ({ callerId }) => {
            if(userProfile._id?.toString() === callerId) {
                toast({ title: "Llamada Rechazada", description: "El usuario ha rechazado la llamada." });
                // Here you would add logic to close the "calling" UI for the caller
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });

        return () => {
            newSocket.disconnect();
        };
    }
  }, [userProfile.isAuthenticated, userProfile._id, toast]);
  
  const handleAcceptCall = () => {
    if (incomingCall) {
        // Navigate to the call page, passing room name
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
