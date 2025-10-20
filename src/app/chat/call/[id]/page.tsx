// src/app/chat/call/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FaPhone, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaUser } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useContacts } from '@/hooks/useContacts';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
        <div className="flex flex-col h-screen w-screen text-white relative overflow-hidden">
            {/* Blurred Background */}
            {contact?.imageUrl && (
                 <Image
                    src={contact.imageUrl}
                    alt="Fondo de llamada"
                    layout="fill"
                    objectFit="cover"
                    className="blur-2xl scale-110 brightness-50"
                />
            )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/80" />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col justify-between items-center h-full p-8">
                {/* Contact Info */}
                 <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-col items-center text-center pt-16"
                >
                    <Avatar className="h-28 w-28 border-4 border-white/20 bg-black/20">
                        <AvatarImage src={contact?.imageUrl} alt={contact?.name} />
                        <AvatarFallback className="text-4xl bg-slate-700">
                             {contact?.name ? contact.name.charAt(0).toUpperCase() : <FaUser />}
                        </AvatarFallback>
                    </Avatar>
                    <h1 className="text-3xl font-bold mt-4">{contact?.name || 'Desconocido'}</h1>
                    <p className="text-lg text-white/80 mt-1">{callStatus}</p>
                </motion.div>
                
                <div className="w-full mb-8">
                  {/* Local Video Preview (for video calls) */}
                  {callType === 'video' && (
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                          className="absolute bottom-32 right-4 sm:right-8 h-48 w-32 bg-black/50 rounded-xl border-2 border-white/20 overflow-hidden shadow-lg"
                      >
                           {isCameraOff ? (
                              <div className="w-full h-full flex items-center justify-center">
                                  <FaVideoSlash className="text-white/50" size={32}/>
                              </div>
                          ) : (
                              <div className="w-full h-full bg-green-400" /> /* Placeholder for local video */
                          )}
                      </motion.div>
                  )}

                  {/* Controls */}
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="flex justify-center items-center gap-6"
                  >
                       <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24}/>}
                      </Button>
                       {callType === 'video' && (
                          <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm" onClick={() => setIsCameraOff(!isCameraOff)}>
                              {isCameraOff ? <FaVideoSlash size={24} /> : <FaVideo size={24} />}
                          </Button>
                      )}
                       <Button variant="destructive" size="icon" className="h-16 w-16 rounded-full" onClick={handleEndCall}>
                          <FaPhone size={24} className="transform -rotate-[135deg]" />
                      </Button>
                  </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CallPage;
