// src/components/chat/MarketplaceDialog.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Search, Sparkles, Store, Briefcase, Landmark, ArrowLeft, ShoppingBag, Wallet, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { AssistantConfig, CreditOffer } from '@/types';
import CreditApplicationDialog from './CreditApplicationDialog';
import { useApp } from '@/providers/AppProvider';


interface MarketplaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo data - replace with actual data from an API
const demoItems = {
  products: [
    { id: 1, name: "Asesoría de Marketing", price: 1500, seller: "Juan Pérez", imageUrl: "https://i.imgur.com/8p8Yf9u.png", imageHint: 'digital marketing' },
    { id: 2, name: "Diseño de Logotipo", price: 1200, seller: "Ana Gómez", imageUrl: "https://i.imgur.com/a2gGAlJ.png", imageHint: 'logo design' },
    { id: 3, name: "Paquete de Redes Sociales", price: 2500, seller: "Carlos Ruiz", imageUrl: "https://i.imgur.com/uSfeGjW.png", imageHint: 'social media' },
  ],
  services: [
    { id: 4, name: "Clases de Guitarra", price: 300, seller: "Sofía Luna", imageUrl: "https://i.imgur.com/cQ0Dvhv.png", imageHint: 'guitar lesson' },
    { id: 5, name: "Mantenimiento de PC", price: 500, seller: "Luis Mendoza", imageUrl: "https://i.imgur.com/W2yvA5L.png", imageHint: 'pc maintenance' },
  ],
  credits: [
    { id: 'credit-1', name: "Crédito Personal Rápido", amount: 1000, interest: "10", term: '6 meses', seller: "Financiera Confianza", imageUrl: "https://i.imgur.com/sM7a2pM.png", imageHint: 'personal loan' },
    { id: 'credit-2', name: "Crédito Pyme Impulsa", amount: 5000, interest: "8", term: '12 meses', seller: "Banco Emprendedor", imageUrl: "https://i.imgur.com/W2yvA5L.png", imageHint: 'business loan' },
  ]
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

type View = 'categories' | 'products' | 'services' | 'credits';

const categoryConfig = {
    products: { icon: Store, title: 'Tiendas', description: 'Explora productos de vendedores locales.', gradient: 'from-blue-500 to-cyan-500' },
    services: { icon: Briefcase, title: 'Servicios', description: 'Encuentra profesionales para lo que necesites.', gradient: 'from-purple-500 to-violet-500' },
    credits: { icon: Landmark, title: 'Créditos', description: 'Opciones de financiamiento a tu alcance.', gradient: 'from-emerald-500 to-green-500' },
};

const MarketplaceDialog = ({ isOpen, onOpenChange }: MarketplaceDialogProps) => {
    const { state } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState<View>('categories');
    const { toast } = useToast();
    const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
    const [selectedCreditAssistant, setSelectedCreditAssistant] = useState<AssistantConfig | null>(null);

    
    // Placeholder for items that would be fetched based on location
    const [nearbyItems, setNearbyItems] = useState(demoItems);

    useEffect(() => {
        if (!isOpen) {
            // Reset to initial state when dialog is closed
            setTimeout(() => {
                setCurrentView('categories');
                setSearchTerm('');
            }, 300);
        }
    }, [isOpen]);

    useEffect(() => {
        if (currentView !== 'categories') {
            // TODO: Implementar lógica de geolocalización para obtener la ubicación del usuario
            // y luego filtrar 'demoItems' para mostrar solo los que están cerca.
            setNearbyItems(demoItems);
        }
    }, [currentView]);

    const filteredItems = useMemo(() => {
        if (currentView === 'categories') return [];
        return nearbyItems[currentView].filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, currentView, nearbyItems]);
    
    const handleRequestCredit = (credit: any) => {
        // Here, we'd find the assistant linked to this credit offer.
        // For now, let's assume we can find them in the userProfile's assistants.
        // In a real app, the `credit` object would have an `assistantId`.
        const assistant = state.userProfile.assistants.find(a => a.name.includes(credit.seller));
        if (assistant) {
            setSelectedCreditAssistant(assistant);
            setIsCreditDialogOpen(true);
        } else {
             toast({
                title: "Asistente no encontrado",
                description: "No se pudo encontrar al asistente que ofrece este crédito.",
                variant: "destructive"
            });
        }
    }

    const renderCategories = () => (
         <motion.div 
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 sm:p-6 space-y-4"
        >
            <div className="grid grid-cols-1 gap-4">
                {Object.keys(categoryConfig).map(catKey => {
                    const cat = catKey as keyof typeof categoryConfig;
                    const config = categoryConfig[cat];
                    const Icon = config.icon;
                    return (
                        <div
                            key={cat}
                            onClick={() => setCurrentView(cat)}
                            className={cn(
                                'relative rounded-xl p-6 text-white overflow-hidden cursor-pointer group transition-all duration-300 ease-in-out',
                                'bg-gradient-to-br',
                                config.gradient
                            )}
                        >
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-125 transition-transform duration-300">
                                <Icon className="w-full h-full" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold">{config.title}</h3>
                                <p className="text-sm opacity-80 mt-1">{config.description}</p>
                            </div>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                        </div>
                    );
                })}
            </div>
            
             <Card className="cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors flex items-center justify-center text-center p-4">
                <Sparkles className="h-5 w-5 text-yellow-500 mr-3"/>
                <p className="font-semibold text-sm text-muted-foreground">¡Novedades cada día!</p>
            </Card>
        </motion.div>
    );

    const renderItemsList = () => {
        const Icon = currentView !== 'categories' ? categoryConfig[currentView].icon : Sparkles;
        const title = currentView !== 'categories' ? categoryConfig[currentView].title : 'Resultados';

        return (
            <motion.div
                key="items-list"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="flex flex-col h-full"
            >
                <div className="px-4 sm:px-6 pt-4 space-y-3">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentView('categories')} className="text-muted-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Volver a Categorías
                    </Button>
                    <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary"/>
                        <h3 className="text-xl font-bold">{title}</h3>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en esta categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-grow my-4">
                    <div className="px-4 sm:px-6">
                        {filteredItems.length > 0 ? (
                            <motion.div
                                className={cn("grid gap-4", currentView === 'credits' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3')}
                                variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                                initial="hidden"
                                animate="visible"
                            >
                                {filteredItems.map(item => (
                                    <motion.div key={item.id} variants={cardVariants}>
                                      {currentView === 'credits' ? (
                                        <Card className="overflow-hidden group glow-card transition-all duration-300">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                      <p className="text-xs text-muted-foreground">{item.seller}</p>
                                                      <p className="font-bold text-lg text-primary">{item.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-extrabold text-foreground">${(item as any).amount?.toLocaleString()}</p>
                                                        <p className="text-xs text-muted-foreground">Monto Máximo</p>
                                                    </div>
                                                </div>
                                                 <div className="flex justify-between text-xs pt-3 border-t">
                                                    <p>Tasa de interés: <span className="font-semibold">{(item as any).interest}% mensual</span></p>
                                                    <p>Plazo: <span className="font-semibold">{(item as any).term}</span></p>
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Button size="sm" variant="secondary" className="flex-1">
                                                        <Send className="mr-2 h-4 w-4"/> Chatear
                                                    </Button>
                                                    <Button size="sm" className="flex-1 bg-brand-gradient text-primary-foreground" onClick={() => handleRequestCredit(item)}>
                                                        <Wallet className="mr-2 h-4 w-4"/> Solicitar Crédito
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                      ) : (
                                        <Card className="overflow-hidden cursor-pointer group glow-card transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                                            <div className="aspect-square relative w-full">
                                                <Image src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={(item as any).imageHint} />
                                            </div>
                                            <CardContent className="p-2 sm:p-3">
                                                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">de {item.seller}</p>
                                                <p className="font-bold text-base mt-1">
                                                    ${(item as any).price.toFixed(2)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                      )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <p>No se encontraron resultados.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </motion.div>
        );
    };

  return (
    <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl">
            <DialogHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                <DialogTitle className="text-2xl font-bold text-brand-gradient">
                    Mercado
                </DialogTitle>
                <DialogDescription>
                    Explora productos, servicios y créditos ofrecidos por la comunidad.
                </DialogDescription>
                </div>
            </div>
            </DialogHeader>
            
            <AnimatePresence mode="wait">
                {currentView === 'categories' ? renderCategories() : renderItemsList()}
            </AnimatePresence>
            
            <DialogFooter className="p-4 border-t mt-auto">
            <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
            </DialogClose>
            </DialogFooter>
        </DialogContent>
        </Dialog>
        {selectedCreditAssistant && (
            <CreditApplicationDialog 
                isOpen={isCreditDialogOpen}
                onOpenChange={setIsCreditDialogOpen}
                assistant={selectedCreditAssistant}
            />
        )}
    </>
  );
};

export default MarketplaceDialog;
