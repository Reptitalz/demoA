// src/components/chat/admin/AdminViews.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign, Crown, Database, BookText, Percent, Calendar, Edit, ArrowRight, ArrowLeft, Truck, Store, Wallet, Send, Building, CheckCircle, Loader2, CheckSquare, History, Radio, Palette, Image as ImageIcon, Briefcase, Landmark, MapPin } from 'lucide-react';
import { APP_NAME, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, addWeeks, addMonths, add } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import DatabaseLinkDialog from './DatabaseLinkDialog';
import InstructionsDialog from './InstructionsDialog';
import { useApp } from '@/providers/AppProvider';
import { useToast } from "@/hooks/use-toast";
import type { AssistantConfig, ChatMessage, Product, Catalog, CreditLine, CreditOffer, UserProfile, RequiredDocument } from '@/types';
import BusinessInfoDialog from '@/components/dashboard/BusinessInfoDialog';
import CreateAssistantDialog from '@/components/dashboard/CreateAssistantDialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppIcon from '@/components/shared/AppIcon';
import { Progress } from '@/components/ui/progress';
import { extractAmountFromImage } from '@/ai/flows/extract-amount-flow';
import { openDB, MESSAGES_STORE_NAME, AUTHORIZED_PAYMENTS_STORE_NAME } from '@/lib/db';
import { Textarea } from '@/components/ui/textarea';
import AddProductDialog from '@/components/chat/admin/AddProductDialog';
import CreateCatalogDialog from './CreateCatalogDialog';
import CreditHistoryDialog from './CreditHistoryDialog';
import ReceiptDialog from './ReceiptDialog';
import { Badge } from '@/components/ui/badge';


// --- IndexedDB Helper Functions (replicated for this component) ---


interface StoredMessage extends ChatMessage {
    sessionId: string;
    // IndexedDB adds a keyPath property when using autoIncrement
    id?: number; 
}

const getAllMessagesFromDB = async (): Promise<StoredMessage[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MESSAGES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(MESSAGES_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            resolve(request.result as StoredMessage[]);
        };
        request.onerror = () => {
            console.error('Error fetching all messages:', request.error);
            reject(request.error);
        };
    });
};

const getAllAuthorizedPayments = async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(AUTHORIZED_PAYMENTS_STORE_NAME, 'readonly');
        const store = tx.objectStore(AUTHORIZED_PAYMENTS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
    });
}

const authorizePaymentInDB = async (payment: any) => {
    const db = await openDB();
    const tx = db.transaction([AUTHORIZED_PAYMENTS_STORE_NAME, MESSAGES_STORE_NAME], 'readwrite');
    const authStore = tx.objectStore(AUTHORIZED_PAYMENTS_STORE_NAME);
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    
    // Ensure the object being put has the keyPath property
    if (!payment.messageId) {
        throw new Error("Payment object must have a messageId to be authorized.");
    }
    
    await authStore.put(payment);
    // After authorizing, delete the original message to remove it from "pending"
    await msgStore.delete(payment.messageId);
    
    await tx.done;
}

const rejectPaymentInDB = async (messageId: number) => {
     const db = await openDB();
     const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
     await tx.objectStore(MESSAGES_STORE_NAME).delete(messageId);
     await tx.done;
}

const demoPendingPayments = [
    { id: 'demo-1', messageId: 999, product: 'Comprobante (imagen)', assistantName: 'Asistente de Ventas', userName: 'Cliente Demo 1', receiptUrl: 'https://i.imgur.com/8p8Yf9u.png', status: 'pending', amount: 0 },
    { id: 'demo-2', messageId: 998, product: 'Comprobante (documento)', assistantName: 'Asistente de Cobranza', userName: 'Cliente Demo 2', fileName: 'factura_mayo.pdf', status: 'pending', amount: 0 },
];
const demoCompletedPayments = [
    { id: 'demo-3', messageId: 997, product: 'Comprobante (imagen)', assistantName: 'Asistente de Ventas', userName: 'Cliente Demo 3', receiptUrl: 'https://i.imgur.com/8p8Yf9u.png', status: 'completed', amount: 1500 },
];


// Demo data for admin chat trays
const demoAdminChats: AssistantConfig[] = [
    {
        id: 'user-1',
        name: 'Cliente A - Asistente de Ventas',
        isActive: true,
        type: 'whatsapp',
        messageCount: 0,
        monthlyMessageLimit: 0,
        purposes: [],
        chatPath: 'demo-asistente-1',
    },
    {
        id: 'user-2',
        name: 'Usuario B - Asistente de Soporte',
        isActive: false,
        type: 'whatsapp',
        messageCount: 0,
        monthlyMessageLimit: 0,
        purposes: [],
        chatPath: 'demo-asistente-2',
    },
];

export const BankView = () => {
    const { state } = useApp();
    const { assistants, isAuthenticated } = state.userProfile;
    const { toast } = useToast();
    const [allPayments, setAllPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);

        if (!isAuthenticated) {
            setAllPayments([...demoPendingPayments, ...demoCompletedPayments]);
            setIsLoading(false);
            return;
        }

        try {
            const [pendingMessages, authorizedPayments] = await Promise.all([
                getAllMessagesFromDB(),
                getAllAuthorizedPayments()
            ]);
            
            const pending = pendingMessages
                .filter(msg => msg.role === 'user' && typeof msg.content === 'object' && ['image', 'video', 'audio', 'document'].includes(msg.content.type))
                .map((msg, index) => {
                    // Try to find the assistant associated with this message's session
                    const assistant = assistants.find(a => a.chatPath && msg.sessionId.includes(a.chatPath));
                    const content = msg.content as { type: string, url: string, name?: string };
                    return {
                        id: `pending-${msg.id || Date.now() + index}`,
                        messageId: msg.id,
                        product: `Comprobante (${content.type})`,
                        fileName: content.name,
                        assistantName: assistant?.name || 'Desconocido',
                        userName: `Usuario ${msg.sessionId.slice(-6)}`,
                        chatPath: msg.sessionId,
                        amount: 0.00,
                        receiptUrl: content.url,
                        receivedAt: msg.time, // Assuming ChatMessage has a 'time' property
                        status: 'pending',
                    };
                });
            
            const completed = authorizedPayments.map(p => ({ ...p, status: 'completed' }));
            
            setAllPayments([...pending, ...completed]);

        } catch (error) {
            console.error("Failed to load payments from IndexedDB:", error);
            toast({ title: 'Error', description: 'No se pudieron cargar los comprobantes desde la base de datos local.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [assistants, toast, isAuthenticated]);
    
    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const filteredPayments = useMemo(() => {
        return allPayments.filter(p => p.status === filter);
    }, [filter, allPayments]);

    const totalIncome = useMemo(() => {
        return allPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    }, [allPayments]);
    
    const pendingCount = useMemo(() => {
        return allPayments.filter(p => p.status === 'pending').length;
    }, [allPayments]);

    const handleViewReceipt = (payment: any) => {
        setSelectedPayment(payment);
        setIsReceiptOpen(true);
    };
    
    const handleAction = async (messageId: number, action: 'authorize' | 'reject', amount?: number) => {
        if (!isAuthenticated) {
            toast({ title: 'Modo Demo', description: 'Las acciones no están disponibles en modo demostración.' });
            return;
        }
    
        const paymentToProcess = allPayments.find(p => p.messageId === messageId);
        if (!paymentToProcess) return;
    
        try {
            if (action === 'authorize' && amount) {
                const authorizedPayment = { ...paymentToProcess, status: 'completed', amount: amount, authorizedAt: new Date() };
                await authorizePaymentInDB(authorizedPayment);
                toast({ title: "Acción Realizada", description: "El comprobante ha sido autorizado."});
                
                // Optimistic UI update
                setAllPayments(prev => {
                    const pending = prev.filter(p => p.messageId !== messageId);
                    const completed = [...prev.filter(p => p.status === 'completed'), authorizedPayment];
                    return [...pending.filter(p=>p.status==='pending'), ...completed];
                });
    
            } else if (action === 'reject') {
                await rejectPaymentInDB(messageId);
                toast({ title: "Acción Realizada", description: "El comprobante ha sido rechazado y eliminado."});
                
                // Optimistic UI update
                setAllPayments(prev => prev.filter(p => p.messageId !== messageId));
            }
        } catch(error) {
            console.error("DB action failed:", error);
            toast({ title: "Error", description: `No se pudo ${action === 'authorize' ? 'autorizar' : 'rechazar'} el comprobante.`, variant: "destructive" });
        } finally {
            setIsReceiptOpen(false);
        }
    };

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Bandeja de Autorizaciones</h1>
                    </div>
                </div>
            </header>
             <div className="p-4">
                 <Card className="shadow-lg relative overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 text-white">
                    <div 
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        }}
                    />
                    <div className="absolute top-2 right-2 h-0 w-0 border-t-[60px] border-t-white/5 border-l-[60px] border-l-transparent" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm opacity-80">Ingreso Total (Autorizado)</p>
                                <p className="text-4xl font-extrabold mt-1">
                                    ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                             <Landmark className="h-8 w-8 text-white/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="px-4 pb-2 border-b">
                <div className="flex gap-2">
                    <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')} className="h-8 text-xs flex-1 relative">
                        {pendingCount > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                        Por Autorizar
                    </Button>
                    <Button variant={filter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('completed')} className="h-8 text-xs flex-1">
                        Autorizados
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-grow px-2 min-h-0">
                <div className="p-2 space-y-3">
                    {isLoading ? (
                         <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm">Cargando comprobantes...</p>
                        </div>
                    ) : filteredPayments.length > 0 ? filteredPayments.map(payment => (
                         <Card key={payment.id} className="glow-card">
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">{payment.product}</p>
                                        <p className="text-xs text-muted-foreground">Asistente: {payment.assistantName}</p>
                                        <p className="text-xs text-muted-foreground">De: {payment.userName}</p>
                                    </div>
                                    {payment.amount > 0 && <p className="font-bold text-green-500">${payment.amount.toFixed(2)}</p>}
                                </div>
                                {payment.status === 'pending' && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t">
                                        <Button size="sm" className="flex-1" onClick={() => handleViewReceipt(payment)}>
                                            <Eye className="mr-2"/>Revisar Comprobante
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No hay pagos {filter === 'pending' ? 'pendientes' : 'autorizados'}.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
             <ReceiptDialog 
                payment={selectedPayment}
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                onAction={handleAction}
            />
        </>
    );
}

const CompletedCreditsDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { state } = useApp();
    const { userProfile } = state;

    const completedCredits = useMemo(() => {
        return userProfile.creditLines?.filter(cl => cl.status === 'completed') || [];
    }, [userProfile.creditLines]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[90vh]">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" /> Historial de Créditos Completados
                    </DialogTitle>
                    <DialogDescription>Aquí se muestran los créditos que han sido pagados en su totalidad.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-4 space-y-3">
                        {completedCredits.length > 0 ? completedCredits.map(credit => (
                            <Card key={credit.id}>
                                <CardContent className="p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-500/10 rounded-full">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{credit.applicantIdentifier}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Completado el {format(new Date(credit.updatedAt), 'dd MMM, yyyy', { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-600">${credit.amount.toFixed(2)}</p>
                                </CardContent>
                            </Card>
                        )) : (
                            <p className="text-center text-muted-foreground p-8">No hay créditos completados.</p>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const cardStyles = [
    { id: 'slate', name: 'Gris Pizarra', gradient: 'from-slate-900 to-slate-800' },
    { id: 'blue', name: 'Azul Cósmico', gradient: 'from-blue-900 to-cyan-800' },
    { id: 'purple', name: 'Púrpura Galáctico', gradient: 'from-purple-900 to-violet-800' },
    { id: 'green', name: 'Verde Esmeralda', gradient: 'from-green-900 to-teal-800' },
];

const CreditOfferCarousel = ({ onAdd }: { onAdd: () => void }) => {
    const { state } = useApp();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const creditOffers = state.userProfile.creditOffers || [];

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
        <div className="w-full">
            <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2">
                {creditOffers.map((offer) => {
                    const assistant = state.userProfile.assistants.find(a => a.id === offer.assistantId);
                    const selectedStyle = cardStyles.find(s => s.id === offer.cardStyle);
                    const cardBgStyle = offer.cardStyle === 'custom-image' && offer.cardImageUrl
                        ? { backgroundImage: `url(${offer.cardImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : {};
                    const cardGradientClass = offer.cardStyle === 'custom-color' 
                        ? '' 
                        : selectedStyle?.gradient;
                    const customGradientStyle = offer.cardStyle === 'custom-color' 
                        ? { background: `linear-gradient(to bottom right, ${offer.customColor}, #000)` }
                        : {};

                    return (
                        <div key={offer.id} className="w-full flex-shrink-0 snap-center p-2">
                             <div 
                                style={{...cardBgStyle, ...customGradientStyle}}
                                className={cn("bg-gradient-to-br text-white rounded-lg shadow-2xl aspect-[1.586] p-4 flex flex-col justify-between relative overflow-hidden transition-all", cardGradientClass)}
                            >
                                <motion.div className="absolute -top-1/2 -right-1/3 w-2/3 h-full bg-white/5 rounded-full filter blur-3xl" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5"><AppIcon className="h-4 w-4 brightness-0 invert"/> <span className="font-semibold text-xs">{assistant?.name || 'Hey Manito!'}</span></div>
                                    <Banknote className="h-5 w-5 text-yellow-300"/>
                                </div>
                                <div className="text-left"><p className="font-mono text-xl tracking-wider">${offer.amount.toLocaleString()}</p> <p className="text-[10px] opacity-70">Línea de Crédito</p></div>
                                 <div className="flex justify-between items-end text-xs font-mono">
                                    <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-white/50"/> <div><p className="opacity-70 text-[8px] leading-tight">TASA MENSUAL</p><p className="font-medium text-[10px] leading-tight">{offer.interest}%</p></div></div>
                                    <div className="text-right"><p className="opacity-70 text-[8px] leading-tight">PLAZO</p><p className="font-medium text-[10px] leading-tight">{offer.term} {{'weeks': 'SEM', 'fortnights': 'QUINC', 'months': 'MESES'}[offer.termUnit]}</p></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div className="w-full flex-shrink-0 snap-center p-2">
                     <div 
                        onClick={onAdd}
                        className="border-2 border-dashed border-muted-foreground/50 rounded-lg aspect-[1.586] flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer bg-muted/30"
                    >
                        <Plus className="h-8 w-8 mb-2"/>
                        <p className="font-semibold text-sm">Crear Nueva Oferta</p>
                    </div>
                </div>
            </div>
            {creditOffers.length > 0 && (
                <div className="flex justify-center mt-2 space-x-2">
                    {[...creditOffers, {}].map((_, index) => (
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
                                activeIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                            )}
                            aria-label={`Ir a la oferta ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};



const CreateCreditOfferDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { state, dispatch } = useApp();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [interest, setInterest] = useState('');
    const [term, setTerm] = useState('');
    const [termUnit, setTermUnit] = useState<'weeks' | 'fortnights' | 'months'>('months');
    const [cardStyle, setCardStyle] = useState('slate');
    const [customColor, setCustomColor] = useState("#000000");
    const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
    const [assistantId, setAssistantId] = useState<string | undefined>();
    const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
    const [newDocTitle, setNewDocTitle] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const assistants = state.userProfile.assistants || [];
    const totalSteps = 7;

    const handleNext = () => {
        if (step === 1 && !name) return toast({ title: "Campo requerido", description: "Por favor, ingresa un nombre para la oferta.", variant: "destructive" });
        if (step === 2 && !amount) return toast({ title: "Campo requerido", description: "Por favor, ingresa un monto.", variant: "destructive" });
        if (step === 3 && !interest) return toast({ title: "Campo requerido", description: "Por favor, ingresa una tasa de interés.", variant: "destructive" });
        if (step === 4 && !term) return toast({ title: "Campo requerido", description: "Por favor, ingresa un plazo.", variant: "destructive" });
        if (step === 5 && requiredDocuments.length === 0) return toast({ title: "Campo requerido", description: "Añade al menos un documento requerido.", variant: "destructive" });
        if (step === 6 && !cardStyle) return toast({ title: "Campo requerido", description: "Por favor, selecciona un estilo.", variant: "destructive" });
        if (step === 7 && !assistantId) return toast({ title: "Campo requerido", description: "Por favor, selecciona un asistente gestor.", variant: "destructive" });
        setStep(s => s + 1);
    };
    const handleBack = () => setStep(s => s - 1);
    
    const handleCreate = () => {
        if (!name || !amount || !interest || !term || !assistantId || requiredDocuments.length === 0) {
            toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos para crear la oferta.", variant: "destructive" });
            return;
        }

        const newOffer: CreditOffer = {
            id: `co_${Date.now()}`,
            name,
            amount: parseFloat(amount),
            interest: parseFloat(interest),
            term: parseInt(term),
            termUnit: termUnit,
            cardStyle: cardStyle,
            customColor: cardStyle === 'custom-color' ? customColor : undefined,
            cardImageUrl: cardStyle === 'custom-image' ? cardImageUrl : undefined,
            assistantId: assistantId,
            requiredDocuments: requiredDocuments,
        };

        dispatch({ type: 'UPDATE_USER_PROFILE', payload: {
            creditOffers: [...(state.userProfile.creditOffers || []), newOffer]
        }});

        toast({ title: "Oferta Creada", description: "La nueva oferta de crédito ha sido creada y asignada." });
        onOpenChange(false);
    }
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCardImageUrl(reader.result as string);
                setCardStyle('custom-image'); // A special id to know an image is used
            }
            reader.readAsDataURL(file);
        }
    };
    
    const calculateProfit = useCallback(() => {
        const principal = parseFloat(amount) || 0;
        const monthlyRate = (parseFloat(interest) || 0) / 100;
        const numTerms = parseInt(term) || 0;

        if (principal <= 0 || monthlyRate <= 0 || numTerms <= 0) {
            return 0;
        }
        
        let totalInterest = 0;
        switch (termUnit) {
            case 'weeks':
                totalInterest = principal * (monthlyRate / 4) * numTerms;
                break;
            case 'fortnights':
                totalInterest = principal * (monthlyRate / 2) * numTerms;
                break;
            case 'months':
            default:
                totalInterest = principal * monthlyRate * numTerms;
                break;
        }
        return totalInterest;
    }, [amount, interest, term, termUnit]);
    
    const handleAddDocument = () => {
        if (newDocTitle.trim()) {
            setRequiredDocuments([...requiredDocuments, { id: `doc_${Date.now()}`, title: newDocTitle.trim() }]);
            setNewDocTitle('');
        }
    };

    const handleRemoveDocument = (id: string) => {
        setRequiredDocuments(requiredDocuments.filter(doc => doc.id !== id));
    };


    const stepContent = () => {
        switch(step) {
            case 1: return (
                <div className="space-y-2">
                    <Label htmlFor="offer-name" className="text-base">Nombre de la Oferta</Label>
                    <Input id="offer-name" type="text" placeholder="Ej: Crédito Emprendedor" value={name} onChange={e => setName(e.target.value)} className="text-lg py-6" />
                </div>
            );
            case 2: return (
                <div className="space-y-2">
                    <Label htmlFor="amount" className="text-base">Monto Máximo del Crédito</Label>
                    <Input id="amount" type="number" placeholder="Ej: 5000" value={amount} onChange={e => setAmount(e.target.value)} className="text-lg py-6" />
                </div>
            );
            case 3: return (
                <div className="space-y-2">
                    <Label htmlFor="interest" className="text-base">Tasa de Interés</Label>
                    <Input id="interest" type="number" placeholder="Ej: 10" value={interest} onChange={e => setInterest(e.target.value)} className="text-lg py-6" />
                    <p className="text-xs text-muted-foreground pt-1">¿Cuánto quieres ganar de interés?</p>
                </div>
            );
            case 4: 
                const profit = calculateProfit();
                return (
                    <div className="space-y-4">
                        {profit > 0 && (
                             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-green-500/10 rounded-lg text-center">
                                <Label className="text-xs text-green-700 dark:text-green-300">Ganancia Total Estimada</Label>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ${profit.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </motion.div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="term" className="text-base">Plazo de Pago</Label>
                            <Input id="term" type="number" placeholder="Ej: 12" value={term} onChange={e => setTerm(e.target.value)} className="text-lg py-6" />
                        </div>
                        <RadioGroup value={termUnit} onValueChange={(val: any) => setTermUnit(val)} className="grid grid-cols-3 gap-2">
                            {(['weeks', 'fortnights', 'months'] as const).map(unit => (
                                <Label key={unit} htmlFor={`unit-${unit}`} className={cn("p-2 border rounded-md text-center text-xs cursor-pointer", termUnit === unit && "bg-primary text-primary-foreground border-primary")}>
                                    <RadioGroupItem value={unit} id={`unit-${unit}`} className="sr-only"/>
                                    {{'weeks': 'Semanas', 'fortnights': 'Quincenas', 'months': 'Meses'}[unit]}
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
            );
            case 5: return (
                <div className="space-y-4">
                    <Label className="text-base">Documentos Requeridos</Label>
                    <p className="text-sm text-muted-foreground -mt-3">Define el nombre del documento que quieres recibir del cliente para validar su crédito.</p>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Ej: Comprobante de ingresos"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                        />
                        <Button onClick={handleAddDocument} size="sm">Añadir</Button>
                    </div>
                    <ScrollArea className="h-32 border rounded-md p-2">
                        <div className="space-y-2">
                            {requiredDocuments.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                    <p className="text-sm">{doc.title}</p>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDocument(doc.id)}>
                                        <XCircle className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </div>
                            ))}
                            {requiredDocuments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No se han añadido documentos.</p>}
                        </div>
                    </ScrollArea>
                </div>
            );
            case 6:
                const selectedStyle = cardStyles.find(s => s.id === cardStyle);
                const cardBgStyle = cardStyle === 'custom-image' && cardImageUrl
                    ? { backgroundImage: `url(${cardImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : {};
                const cardGradientClass = cardStyle === 'custom-color' 
                    ? '' 
                    : selectedStyle?.gradient;
                const customGradientStyle = cardStyle === 'custom-color' 
                    ? { background: `linear-gradient(to bottom right, ${customColor}, #000)` }
                    : {};

                return (
                    <div className="space-y-4">
                        <Label className="text-base">Diseño de la Tarjeta</Label>
                        <div 
                           style={{...cardBgStyle, ...customGradientStyle}}
                           className={cn("bg-gradient-to-br text-white rounded-lg shadow-2xl aspect-[1.586] p-4 flex flex-col justify-between relative overflow-hidden transition-all", cardGradientClass)}
                        >
                            <motion.div className="absolute -top-1/2 -right-1/3 w-2/3 h-full bg-white/5 rounded-full filter blur-3xl" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} />
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-1.5"><AppIcon className="h-4 w-4 brightness-0 invert"/> <span className="font-semibold text-xs">Hey Manito!</span></div>
                                <Banknote className="h-5 w-5 text-yellow-300"/>
                            </div>
                            <div className="text-left"><p className="font-mono text-xl tracking-wider">${parseInt(amount || '0').toLocaleString()}</p> <p className="text-[10px] opacity-70">Línea de Crédito</p></div>
                             <div className="flex justify-between items-end text-xs font-mono">
                                <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-white/50"/> <div><p className="opacity-70 text-[8px] leading-tight">TASA MENSUAL</p><p className="font-medium text-[10px] leading-tight">{interest || '0'}%</p></div></div>
                                <div className="text-right"><p className="opacity-70 text-[8px] leading-tight">PLAZO</p><p className="font-medium text-[10px] leading-tight">{term || '0'} {{'weeks': 'SEM', 'fortnights': 'QUINC', 'months': 'MESES'}[termUnit]}</p></div>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 gap-2">
                            <RadioGroup value={cardStyle} onValueChange={(val) => { setCardStyle(val); setCardImageUrl(null); }} className="flex gap-2">
                               {cardStyles.map(style => (
                                   <Label key={style.id} htmlFor={`style-${style.id}`} className={cn("h-8 w-8 rounded-full border-2 p-0.5 cursor-pointer", cardStyle === style.id && "border-primary")}>
                                       <RadioGroupItem value={style.id} id={`style-${style.id}`} className="sr-only" />
                                       <div className={cn("h-full w-full rounded-full bg-gradient-to-br", style.gradient)} />
                                   </Label>
                               ))}
                             </RadioGroup>
                             <div className="flex items-center gap-2">
                                 <Label htmlFor="custom-color-picker" className="h-8 w-8 rounded-full border-2 p-0.5 cursor-pointer flex items-center justify-center" style={{ borderColor: cardStyle === 'custom-color' ? 'hsl(var(--primary))' : 'transparent' }}>
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center">
                                        <Palette className="h-4 w-4 text-white"/>
                                    </div>
                                    <input id="custom-color-picker" type="color" value={customColor} onChange={(e) => { setCustomColor(e.target.value); setCardStyle('custom-color'); setCardImageUrl(null); }} className="sr-only"/>
                                 </Label>
                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon className="h-4 w-4"/>
                                 </Button>
                                 <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload}/>
                            </div>
                        </div>
                    </div>
                );
            case 7: return (
                <div className="space-y-2">
                    <Label htmlFor="assistant" className="text-base">Asistente Gestor</Label>
                    <Select onValueChange={setAssistantId} value={assistantId}>
                        <SelectTrigger id="assistant" className="text-lg py-6">
                            <SelectValue placeholder="Selecciona un asistente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {assistants.map(asst => (
                                <SelectItem key={asst.id} value={asst.id}>{asst.name}</SelectItem>
                            ))}
                            {assistants.length === 0 && <SelectItem value="none" disabled>No tienes asistentes</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
            );
            default: return null;
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-screen h-screen max-w-full flex flex-col" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                 <DialogHeader className="p-4 border-b">
                    <DialogTitle>Crear Nueva Oferta de Crédito</DialogTitle>
                    <DialogDescription>Define los términos y asigna un asistente para gestionar esta oferta.</DialogDescription>
                </DialogHeader>
                <div className="px-4 pt-4">
                    <Progress value={(step / totalSteps) * 100} className="w-full h-2" />
                    <p className="text-xs text-muted-foreground text-center mt-1">Paso {step} de {totalSteps}</p>
                </div>
                <div className="flex-grow flex items-center justify-center p-4">
                    <div className="w-full max-w-sm animate-fadeIn">
                        {stepContent()}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t flex justify-between w-full">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4"/> Atrás</Button>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    )}
                    
                    {step < totalSteps ? (
                        <Button onClick={handleNext}>Siguiente <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    ) : (
                        <Button onClick={handleCreate}>Crear Oferta</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const DeliveryView = () => {
    const [deliveries, setDeliveries] = useState([
        { id: 'delivery-1', productName: 'Pastel de Chocolate Grande', productValue: 450.00, destination: 'Av. Siempre Viva 742, Springfield', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Siempre+Viva+742,+Springfield', status: 'pending', clientName: 'Homero Simpson' },
        { id: 'delivery-2', productName: 'Docena de Cupcakes Variados', productValue: 250.00, destination: 'Calle Falsa 123, Ciudad de México', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Calle+Falsa+123,+Ciudad+de+México', status: 'en_route', clientName: 'Ana María' },
    ]);
    const { toast } = useToast();

    const handleUpdateStatus = (deliveryId: string, newStatus: 'pending' | 'en_route' | 'delivered') => {
        setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: newStatus } : d));
        toast({ title: 'Estado Actualizado', description: `El pedido para ${deliveries.find(d => d.id === deliveryId)?.clientName} ahora está ${newStatus === 'en_route' ? 'en ruta' : 'marcado como entregado'}.` });
    };

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Repartos</h1>
                    </div>
                </div>
            </header>
            <ScrollArea className="flex-grow px-2 min-h-0">
                <div className="p-2 space-y-4">
                    {deliveries.filter(d => d.status !== 'delivered').length > 0 ? (
                        deliveries.filter(d => d.status !== 'delivered').map(delivery => (
                            <Card key={delivery.id} className="glow-card">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{delivery.productName}</CardTitle>
                                        <Badge variant={delivery.status === 'pending' ? 'destructive' : 'default'}>
                                            {delivery.status === 'pending' ? 'Pendiente' : 'En Ruta'}
                                        </Badge>
                                    </div>
                                    <CardDescription>Para: {delivery.clientName}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                        <span className="text-sm font-medium">Valor:</span>
                                        <span className="font-bold text-green-500">${delivery.productValue.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold">Destino:</p>
                                        <p className="text-sm">{delivery.destination}</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-2">
                                     <Button asChild variant="outline" size="sm">
                                        <a href={delivery.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                                            <MapPin className="mr-2 h-4 w-4" /> Ver en Mapa
                                        </a>
                                    </Button>
                                    {delivery.status === 'pending' ? (
                                        <Button size="sm" onClick={() => handleUpdateStatus(delivery.id, 'en_route')}>
                                            <Send className="mr-2 h-4 w-4" /> Iniciar Entrega
                                        </Button>
                                    ) : (
                                         <Button size="sm" onClick={() => handleUpdateStatus(delivery.id, 'delivered')} className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Entregado
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <Truck className="mx-auto h-12 w-12 mb-4"/>
                            <p>No hay entregas pendientes.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </>
    );
};

export const AssistantsList = () => <div></div>;
export const ProductsView = () => <div></div>;
export const CreditView = () => <div></div>;
export const OtherView = ({ viewName }: { viewName: string }) => (
    <div className="flex flex-col h-full bg-transparent">
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
             <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
             <p className="text-sm text-muted-foreground">Vista de {viewName}</p>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Porque no puedo ver este apartado aqui?</p>
        </div>
    </div>
);
