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
      // Logic for websockets removed as calls are no longer supported.
      // Keeping provider structure for potential future real-time features.
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
