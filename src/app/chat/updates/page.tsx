// src/app/chat/updates/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Status {
  id: number;
  name: string;
  time: string;
  image: string;
  own?: boolean;
  caption?: string;
}

const demoUpdates: Status[] = [
  { id: 1, name: 'Mi Estado', time: 'Hace 5 minutos', image: 'https://picsum.photos/seed/my-status/600/800', own: true, caption: '¡Nuevo día!' },
  { id: 2, name: 'Asistente de Ventas', time: 'Hace 20 minutos', image: 'https://picsum.photos/seed/sales-status/600/800', caption: '¡Promociones de fin de semana!' },
  { id: 3, name: 'Soporte Técnico', time: 'Hace 1 hora', image: 'https://picsum.photos/seed/support-status/600/800', caption: 'Estamos para ayudarte' },
  { id: 4, name: 'Juan Pérez', time: 'Hace 3 horas', image: 'https://picsum.photos/seed/juan-status/600/800', caption: 'Disfrutando el paisaje' },
];

const StatusViewer = ({
  statuses,
  startIndex,
  open,
  onOpenChange,
  onStatusViewed,
}: {
  statuses: Status[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusViewed: (statusId: number) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);
  
  useEffect(() => {
    if (!open) return;
    
    onStatusViewed(statuses[currentIndex].id);
    setProgress(0); // Reset progress when status changes
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + 1; // Animation speed
      });
    }, 50); // 50ms interval for a 5-second total duration

    return () => clearInterval(timer);
  }, [currentIndex, open]);
  
  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onOpenChange(false); // Close when last status finishes
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const currentStatus = statuses[currentIndex];
  if (!currentStatus) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/90 border-none p-0 w-screen h-screen max-w-full max-h-screen sm:max-w-md sm:h-[90vh] sm:rounded-lg flex flex-col">
        <DialogTitle className="sr-only">Visor de Estados - {currentStatus.name}</DialogTitle>
        <div className="relative flex-grow flex items-center justify-center overflow-hidden">
           <Image
              src={currentStatus.image}
              alt={`Estado de ${currentStatus.name}`}
              layout="fill"
              objectFit="contain"
              className="animate-fadeIn"
            />
        </div>
        
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <Progress value={progress} className="h-1 bg-white/30 [&>div]:bg-white" />
          <div className="flex items-center gap-3 mt-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentStatus.image} />
              <AvatarFallback>{currentStatus.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{currentStatus.name}</p>
              <p className="text-xs text-gray-300">{currentStatus.time}</p>
            </div>
          </div>
        </div>

        {currentStatus.caption && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm">{currentStatus.caption}</p>
            </div>
        )}

        {/* Navigation Controls */}
        <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1/3 bg-transparent" aria-label="Anterior"></button>
        <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-1/3 bg-transparent" aria-label="Siguiente"></button>
        
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 hover:text-white">
          <X />
        </Button>
      </DialogContent>
    </Dialog>
  );
};


const UpdatesPage = () => {
  const [viewingStatusIndex, setViewingStatusIndex] = useState<number | null>(null);
  const [viewedStatuses, setViewedStatuses] = useState<Set<number>>(new Set());
  
  const recentUpdates = demoUpdates.filter(u => !u.own);

  const handleOpenStatus = (index: number) => {
    setViewingStatusIndex(index);
  };
  
  const handleStatusViewed = useCallback((statusId: number) => {
    setViewedStatuses(prev => new Set(prev).add(statusId));
  }, []);

  return (
    <>
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
              {recentUpdates.map((update, index) => {
                 const isViewed = viewedStatuses.has(update.id);
                 return (
                    <div key={update.id} className="flex items-center gap-4 cursor-pointer" onClick={() => handleOpenStatus(index)}>
                      <Avatar className={cn(
                          "h-14 w-14 border-2 p-0.5",
                          isViewed ? "border-gray-400" : "border-primary"
                      )}>
                        <AvatarImage src={update.image} className="rounded-full" />
                        <AvatarFallback>{update.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{update.name}</p>
                        <p className="text-sm text-muted-foreground">{update.time}</p>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>

    {viewingStatusIndex !== null && (
        <StatusViewer 
            statuses={recentUpdates}
            startIndex={viewingStatusIndex}
            open={viewingStatusIndex !== null}
            onOpenChange={(open) => {
                if (!open) setViewingStatusIndex(null);
            }}
            onStatusViewed={handleStatusViewed}
        />
    )}

    </>
  );
};

export default UpdatesPage;
