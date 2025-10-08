// src/app/chat/calls/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaPhoneAlt, FaVideo, FaSearch, FaPlus, FaLink } from 'react-icons/fa';
import { useContacts } from '@/hooks/useContacts';
import { useRouter } from 'next/navigation';

export default function CallsPage() {
    const { contacts } = useContacts();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contacts, searchTerm]);

    const handleCall = (contactId: string, type: 'voice' | 'video') => {
        // Placeholder for call initiation logic
        console.log(`Starting ${type} call with contact ${contactId}`);
        // router.push(`/chat/call/${contactId}?type=${type}`);
    };
    
    // Example call history
    const callHistory = [
        { id: 1, name: 'Juan Pérez', type: 'outgoing', time: 'Ayer, 10:30 PM', missed: false },
        { id: 2, name: 'Maria López', type: 'incoming', time: 'Hace 2 días', missed: true },
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 space-y-2">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Llamadas</h1>
                    <Button variant="ghost" size="icon"><FaPlus /></Button>
                </div>
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contactos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </header>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-4">
                    
                    <div className="p-4 rounded-lg bg-primary/10 flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-full">
                           <FaLink className="h-5 w-5 text-primary"/>
                        </div>
                        <div>
                            <p className="font-semibold text-primary">Crear enlace de llamada</p>
                            <p className="text-xs text-muted-foreground">Comparte un enlace para hablar con quien quieras.</p>
                        </div>
                    </div>

                    <h2 className="font-semibold text-lg">Contactos</h2>
                    
                    {filteredContacts.length > 0 ? (
                        <div className="space-y-2">
                            {filteredContacts.map(contact => (
                                <div key={contact.chatPath} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={contact.imageUrl} alt={contact.name} />
                                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{contact.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={() => handleCall(contact.chatPath, 'voice')}>
                                            <FaPhoneAlt />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleCall(contact.chatPath, 'video')}>
                                            <FaVideo />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground pt-4">No se encontraron contactos.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
