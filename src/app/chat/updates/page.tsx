
// src/app/chat/updates/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaPlusCircle, FaTimes, FaChevronLeft, FaChevronRight, FaImage, FaPaperPlane, FaUser } from 'react-icons/fa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Status {
  id: number;
  name: string;
  time: string;
  image: string;
  own?: boolean;
  caption?: string;
  avatar?: string;
}

const initialDemoUpdates: Status[] = [];

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
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, open]);
  
  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onOpenChange(false);
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
              <AvatarImage src={currentStatus.avatar} />
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

        <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-1/3 bg-transparent" aria-label="Anterior"></button>
        <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-1/3 bg-transparent" aria-label="Siguiente"></button>
        
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-white hover:bg-white/20 hover:text-white">
          <FaTimes />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const AddStatusDialog = ({
    open,
    onOpenChange,
    onStatusAdded
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusAdded: (status: Status) => void;
}) => {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: "Imagen muy grande", description: "Elige una imagen de menos de 5MB.", variant: "destructive"});
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setImageFile(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = () => {
        if (!imagePreview || !session?.user) {
            toast({ title: "Falta imagen", description: "Por favor, selecciona una imagen para tu estado.", variant: "destructive"});
            return;
        }

        const newStatus: Status = {
            id: Date.now(),
            name: 'Mi Estado',
            time: 'Ahora mismo',
            image: imagePreview,
            own: true,
            caption: caption,
            avatar: session.user.image || undefined,
        };

        onStatusAdded(newStatus);
        onOpenChange(false);
        // Reset state after closing
        setTimeout(() => {
            setImagePreview(null);
            setImageFile(null);
            setCaption('');
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Estado</DialogTitle>
                    <DialogDescription>
                        Comparte una imagen y un mensaje con tus contactos.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div 
                        className="w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Vista previa del estado" layout="fill" objectFit="contain" className="rounded-lg p-2"/>
                        ) : (
                            <div className="text-center">
                                <FaImage className="mx-auto h-12 w-12"/>
                                <p>Haz clic para seleccionar una imagen</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="relative">
                        <Input
                            placeholder="Escribe un mensaje (opcional)..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="pr-10"
                        />
                        <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handlePublish}>
                            <FaPaperPlane/>
                        </Button>
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handlePublish} disabled={!imagePreview}>
                        Publicar Estado
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const UpdatesPage = () => {
  const { data: session } = useSession();
  const [updates, setUpdates] = useState(initialDemoUpdates);
  const [viewingStatusIndex, setViewingStatusIndex] = useState<number | null>(null);
  const [viewedStatuses, setViewedStatuses] = useState<Set<number>>(new Set());
  const [isAddStatusOpen, setIsAddStatusOpen] = useState(false);
  
  const myStatus = updates.find(u => u.own);
  const recentUpdates = updates.filter(u => !u.own);

  const handleOpenStatus = (status: Status) => {
    const statusList = status.own ? [status] : recentUpdates;
    const index = statusList.findIndex(s => s.id === status.id);
    if(index !== -1) {
        setViewingStatusIndex(index);
    }
  };
  
  const handleStatusViewed = useCallback((statusId: number) => {
    setViewedStatuses(prev => new Set(prev).add(statusId));
  }, []);
  
  const handleStatusAdded = (newStatus: Status) => {
     setUpdates(prev => [newStatus, ...prev.filter(s => !s.own)]);
  }

  return (
    <>
    <div className="flex flex-col h-full bg-transparent">
      <header className="p-4 border-b flex justify-between items-center bg-card/80 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">Novedades</h1>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
          {/* My Status */}
          {session?.user ? (
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => myStatus ? handleOpenStatus(myStatus) : setIsAddStatusOpen(true)}>
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-dashed border-muted-foreground">
                  <AvatarImage src={myStatus?.image || session.user.image || undefined} />
                  <AvatarFallback>Yo</AvatarFallback>
                </Avatar>
                {!myStatus && (
                 <div className="absolute -bottom-1 -right-1 bg-background rounded-full">
                   <FaPlusCircle className="h-6 w-6 text-primary" />
                 </div>
                )}
              </div>
              <div>
                <p className="font-semibold">Mi estado</p>
                <p className="text-sm text-muted-foreground">{myStatus ? 'Haz clic para ver' : 'Añade una actualización'}</p>
              </div>
            </div>
          ) : (
             <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarFallback><FaUser/></AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground">Inicia sesión</p>
                <p className="text-sm text-muted-foreground">para poder subir estados.</p>
              </div>
            </div>
          )}

          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recientes</h2>
              <div className="space-y-4">
                {recentUpdates.map((update, index) => {
                  const isViewed = viewedStatuses.has(update.id);
                  return (
                      <div key={update.id} className="flex items-center gap-4 cursor-pointer" onClick={() => handleOpenStatus(update)}>
                        <Avatar className={cn(
                            "h-14 w-14 border-2 p-0.5",
                            isViewed ? "border-gray-400 dark:border-gray-600" : "border-primary"
                        )}>
                          <AvatarImage src={update.avatar} className="rounded-full" />
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
          )}
        </div>
      </ScrollArea>
    </div>

    {viewingStatusIndex !== null && (
        <StatusViewer 
            statuses={myStatus && viewingStatusIndex === 0 && updates[viewingStatusIndex].id === myStatus.id ? [myStatus] : recentUpdates}
            startIndex={viewingStatusIndex}
            open={viewingStatusIndex !== null}
            onOpenChange={(open) => {
                if (!open) setViewingStatusIndex(null);
            }}
            onStatusViewed={handleStatusViewed}
        />
    )}
    
    <AddStatusDialog 
        open={isAddStatusOpen}
        onOpenChange={setIsAddStatusOpen}
        onStatusAdded={handleStatusAdded}
    />
    </>
  );
};

export default UpdatesPage;
