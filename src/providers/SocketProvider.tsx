"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useApp } from './AppProvider';
import { useToast } from '@/hooks/use-toast';
import IncomingCallDialog from '@/components/chat/IncomingCallDialog';
import { useRouter } from 'next/navigation';

interface ISocketContext {
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext>({ socket: null });

export const useSocket = () => useContext(SocketContext);

const SOCKET_SERVER_URL = "http://localhost:8080";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // State for incoming call
  const [incomingCall, setIncomingCall] = useState<{ roomName: string; callerId: string; callerInfo: any } | null>(null);

  useEffect(() => {
    if (userProfile.isAuthenticated && userProfile._id) {
      const newSocket = io(SOCKET_SERVER_URL);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        // Join a personal room to receive direct notifications
        newSocket.emit('joinRoom', userProfile._id?.toString());
      });

      newSocket.on('incoming-call', ({ roomName, callerId, callerInfo }) => {
        console.log(`Incoming call from ${callerId} in room ${roomName}`);
        setIncomingCall({ roomName, callerId, callerInfo });
      });

      newSocket.on('callRejected', ({ by }) => {
        console.log(`Call rejected by ${by}`);
        toast({
            title: "Llamada Rechazada",
            description: "La otra persona ha rechazado la llamada."
        });
        // Here you would add logic to close any "calling..." UI
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        console.log('Disconnecting socket');
        newSocket.disconnect();
      };
    } else if (socket) {
      // If user logs out, disconnect socket
      socket.disconnect();
      setSocket(null);
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
