// src/components/chat/CreditDetailsDialog.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaDollarSign, FaHandshake } from 'react-icons/fa';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { CheckCircle } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';

interface CreditDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // These props are no longer used as we fetch from context, but kept for component signature stability
  creditAmount?: number;
  creditProvider?: string;
}

const CreditDetailsDialog = ({ isOpen, onOpenChange }: CreditDetailsDialogProps) => {
    const { state } = useApp();
    const { userProfile } = state;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const approvedCredits = useMemo(() => {
        return userProfile.creditLines?.filter(cl => cl.status === 'approved') || [];
    }, [userProfile.creditLines]);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                if (cardWidth > 0) {
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    setActiveIndex(newIndex);
                }
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaDollarSign /> Tus Líneas de Crédito
          </DialogTitle>
          <DialogDescription>
            Créditos aprobados por tus asistentes para tus clientes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow flex flex-col justify-center">
             {approvedCredits.length > 0 ? (
                <>
                <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2">
                    {approvedCredits.map((credit, index) => {
                        const assistant = userProfile.assistants.find(a => a.id === credit.assistantId);
                        return (
                            <div key={credit.id} className="w-full flex-shrink-0 snap-center p-2">
                                <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                                    <CardContent className="p-6 space-y-4">
                                        <Avatar className="mx-auto h-12 w-12 mb-2 border-2">
                                            <AvatarImage src={assistant?.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL} />
                                            <AvatarFallback>{assistant?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-muted-foreground font-normal text-xs">Autorizado por {assistant?.name || 'Asistente Desconocido'}</p>
                                        <p className="text-4xl font-extrabold text-foreground mt-2">
                                            ${credit.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className="pt-2 text-green-600 dark:text-green-400">
                                            <CheckCircle className="mx-auto h-6 w-6 mb-2"/>
                                            <p className="font-semibold text-sm">Crédito aprobado para {credit.applicantIdentifier}.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center mt-2 space-x-2">
                    {approvedCredits.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                if (scrollRef.current) {
                                    const cardWidth = scrollRef.current.offsetWidth;
                                    scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                                }
                            }}
                            className={cn(
                                "h-2 w-2 rounded-full transition-all",
                                activeIndex === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                            )}
                            aria-label={`Ir al crédito ${index + 1}`}
                        />
                    ))}
                </div>
                </>
             ) : (
                <div className="text-center text-muted-foreground p-8">
                    <p>No tienes líneas de crédito aprobadas.</p>
                </div>
             )}

            <Button variant="outline" className="w-full">
                <FaHandshake className="mr-2 h-4 w-4" />
                Ver Historial de Créditos
            </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditDetailsDialog;