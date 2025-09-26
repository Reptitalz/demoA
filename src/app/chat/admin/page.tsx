
// src/app/chat/admin/page.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';

const AdminChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      role: 'system',
      content: 'Esta es una interfaz de chat para la sección de administración. Puedes modificarla para añadir nuevas funciones.'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Lógica para manejar el mensaje enviado
    console.log("Admin message sent:", input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
            <p className="text-sm text-muted-foreground">Panel de control de chat</p>
        </div>
      </header>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback><AppIcon/></AvatarFallback>
              </Avatar>
              <div className="bg-card p-3 rounded-lg max-w-lg">
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <Input
            placeholder="Escribe un comando o mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default function AdminPage() {
    return <AdminChatInterface />;
}
