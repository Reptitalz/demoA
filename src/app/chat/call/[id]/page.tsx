// src/app/chat/call/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useContacts } from '@/hooks/useContacts';

const CallPage = () => {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { contacts } = useContacts();

    const callType = searchParams.get('type') as 'audio' | 'video';
    const contactId = params.id as string;
    
    const [contact, setContact] = useState<{ name: string; imageUrl?: string } | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(callType === 'audio');
    const [callStatus, setCallStatus] = useState('Conectando...');
    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => {
        const foundContact = contacts.find(c => c.chatPath === contactId);
        if (foundContact) {
            setContact(foundContact);
        }
    }, [contactId, contacts]);

    useEffect(() => {
        const statusTimer = setTimeout(() => setCallStatus('00:00'), 2000);
        return () => clearTimeout(statusTimer);
    }, []);

    useEffect(() => {
        if (callStatus !== 'Conectando...' && callStatus !== 'Finalizada') {
            const durationInterval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            return () => clearInterval(durationInterval);
        }
    }, [callStatus]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    
     useEffect(() => {
        if (callDuration > 0) {
            setCallStatus(formatDuration(callDuration));
        }
    }, [callDuration]);

    const handleEndCall = () => {
        setCallStatus('Finalizada');
        setTimeout(() => {
            router.back();
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-800 text-white relative">
            {/* Remote User Video (background) */}
            <div className="absolute inset-0 flex items-center justify-center">
                 {!isCameraOff ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                        <Avatar className="h-40 w-40">
                            <AvatarImage src={contact?.imageUrl} alt={contact?.name} />
                            <AvatarFallback className="text-6xl">{contact?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                     </div>
                ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                         <Avatar className="h-40 w-40">
                            <AvatarImage src={contact?.imageUrl} alt={contact?.name} />
                            <AvatarFallback className="text-6xl">{contact?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                )}
            </div>

             {/* Local User Video (small PIP) */}
             {callType === 'video' && (
                <div className="absolute top-4 right-4 h-40 w-28 bg-black rounded-lg border-2 border-white/50 overflow-hidden">
                    {isCameraOff ? (
                        <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                            <FaVideoSlash className="text-white/50" size={32}/>
                        </div>
                    ) : (
                         <div className="w-full h-full bg-green-400" />
                    )}
                </div>
            )}

            {/* Call Info */}
             <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center p-4 bg-black/50 backdrop-blur-sm rounded-xl" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>
                <h1 className="text-2xl font-bold">{contact?.name || 'Desconocido'}</h1>
                <p className="text-sm text-white/80">{callStatus}</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6">
                 <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24}/>}
                </Button>
                 {callType === 'video' && (
                    <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm" onClick={() => setIsCameraOff(!isCameraOff)}>
                        {isCameraOff ? <FaVideoSlash size={24} /> : <FaVideo size={24} />}
                    </Button>
                )}
                 <Button variant="destructive" size="icon" className="h-16 w-16 rounded-full" onClick={handleEndCall}>
                    <FaPhone size={24} className="transform -rotate-[135deg]" />
                </Button>
            </div>
        </div>
    );
};

export default CallPage;
