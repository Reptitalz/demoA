// src/app/chat/updates/page.tsx
"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle } from 'lucide-react';

const demoUpdates = [
  { id: 1, name: 'Mi Estado', time: 'Hace 5 minutos', image: 'https://picsum.photos/seed/my-status/200', own: true },
  { id: 2, name: 'Asistente de Ventas', time: 'Hace 20 minutos', image: 'https://picsum.photos/seed/sales-status/200' },
  { id: 3, name: 'Soporte Técnico', time: 'Hace 1 hora', image: 'https://picsum.photos/seed/support-status/200' },
  { id: 4, name: 'Juan Pérez', time: 'Hace 3 horas', image: 'https://picsum.photos/seed/juan-status/200' },
];

const UpdatesPage = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">Novedades</h1>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          {/* My Status */}
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-dashed border-muted-foreground">
                <AvatarImage src={demoUpdates.find(u => u.own)?.image} />
                <AvatarFallback>Yo</AvatarFallback>
              </Avatar>
               <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                 <PlusCircle className="h-6 w-6 text-primary" />
               </div>
            </div>
            <div>
              <p className="font-semibold">Mi estado</p>
              <p className="text-sm text-muted-foreground">Añade una actualización</p>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recientes</h2>
            <div className="space-y-4">
              {demoUpdates.filter(u => !u.own).map(update => (
                <div key={update.id} className="flex items-center gap-4 cursor-pointer">
                  <Avatar className="h-14 w-14 border-2 border-primary">
                    <AvatarImage src={update.image} />
                    <AvatarFallback>{update.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{update.name}</p>
                    <p className="text-sm text-muted-foreground">{update.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default UpdatesPage;
