// src/components/chat/CreditDetailsDialog.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaDollarSign, FaHandshake, FaSpinner } from 'react-icons/fa';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { CheckCircle } from 'lucide-react';

interface CreditDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  creditAmount: number; // This can now be a default or fallback
  creditProvider: string; // This can be a fallback
}

// Example data for the carousel
const demoCredits = [
  { id: 'credit-1', amount: 500.00, providerName: "Asistente de Ventas", providerImage: "https://i.imgur.com/8p8Yf9u.png" },
  { id: 'credit-2', amount: 1250.75, providerName: "Soporte Técnico", providerImage: "https://i.imgur.com/JzJzJzJ.jpeg" },
  { id: 'credit-3', amount: 300.00, providerName: "Agente de Cobranza", providerImage: "https://i.imgur.com/L4i1i8K.png" },
];


const CreditDetailsDialog = ({ isOpen, onOpenChange }: CreditDetailsDialogProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [acceptedCreditId, setAcceptedCreditId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when dialog closes
            setAcceptedCreditId(null);
        }
    }, [isOpen]);

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
            Créditos autorizados por tus asistentes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow flex flex-col justify-center">
             <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2">
                {demoCredits.map((credit, index) => {
                    const isAccepted = acceptedCreditId === credit.id;
                    return (
                        <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                            <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                                <CardContent className="p-6 space-y-4">
                                    <Avatar className="mx-auto h-12 w-12 mb-2 border-2">
                                        <AvatarImage src={credit.providerImage || DEFAULT_ASSISTANT_IMAGE_URL} />
                                        <AvatarFallback>{credit.providerName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-muted-foreground font-normal text-xs">Autorizado por {credit.providerName}</p>
                                    <p className="text-4xl font-extrabold text-foreground mt-2">
                                        ${credit.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    
                                    {isAccepted ? (
                                        <div className="pt-2 text-green-600 dark:text-green-400">
                                            <CheckCircle className="mx-auto h-6 w-6 mb-2"/>
                                            <p className="font-semibold text-sm">Crédito aceptado.</p>
                                            <p className="text-xs">Esperando a que el vendedor concrete la operación.</p>
                                        </div>
                                    ) : (
                                        <Button className="w-full mt-2" onClick={() => setAcceptedCreditId(credit.id)}>Aceptar Crédito</Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>

             <div className="flex justify-center mt-2 space-x-2">
                {demoCredits.map((_, index) => (
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

            <Button variant="outline" className="w-full">
                <FaHandshake className="mr-2 h-4 w-4" />
                Enviar CLABE Interbancaria
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
