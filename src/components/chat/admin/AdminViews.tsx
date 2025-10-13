// src/components/chat/admin/AdminViews.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign, Crown, Database, BookText, Percent, Calendar, Edit, ArrowRight, ArrowLeft, Truck, Store, Wallet, Send, Building, CheckCircle, Loader2, CheckSquare, History, Radio, Palette, Image as ImageIcon, Briefcase, Landmark } from 'lucide-react';
import { APP_NAME, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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


export const CreditView = () => {
    const { toast } = useApp();
    const { state } = useApp();
    const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isCompletedHistoryOpen, setIsCompletedHistoryOpen] = useState(false);
    const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
    const [clientFilter, setClientFilter] = useState<'activos' | 'nuevos' | 'atrasados'>('activos');


    const activeCredits = state.userProfile.creditLines?.filter(cl => cl.status === 'approved' || cl.status === 'pending' || cl.status === 'Al Corriente' || cl.status === 'Atrasado') || [];
    
    const handleCreditClick = (credit: any) => {
        setSelectedCredit(credit);
        setIsHistoryOpen(true);
    };
    
    const getNextPaymentDate = (lastPaymentDate: string, termType: 'weekly' | 'biweekly' | 'monthly'): Date => {
        const date = new Date(lastPaymentDate);
        switch (termType) {
            case 'weekly':
                return add(date, { weeks: 1 });
            case 'biweekly':
                 return add(date, { weeks: 2 });
            case 'monthly':
                return add(date, { months: 1 });
            default:
                return date;
        }
    };


    return (
        <>
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Crédito</h1>
                    </div>
                </div>
                 <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCompletedHistoryOpen(true)}
                    className="h-8 text-xs"
                >
                    <History className="mr-2 h-4 w-4" />
                    Historial
                </Button>
            </div>
        </header>
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-6">
                <div>
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">Ofertas de Crédito</h3>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreateOfferOpen(true)}>
                            <Plus className="mr-1 h-3 w-3"/> Nueva Oferta
                        </Button>
                     </div>
                     <CreditOfferCarousel onAdd={() => setIsCreateOfferOpen(true)} />
                </div>

                 <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Créditos Activos</h3>
                     <div className="flex items-center gap-2">
                        <Button size="sm" variant={clientFilter === 'activos' ? 'default' : 'outline'} className="text-xs h-7 rounded-full" onClick={() => setClientFilter('activos')}>
                           <span className="mr-2 h-2 w-2 rounded-full bg-green-500"/>
                            Activos
                        </Button>
                         <Button size="sm" variant={clientFilter === 'nuevos' ? 'default' : 'outline'} className="text-xs h-7 rounded-full" onClick={() => setClientFilter('nuevos')}>
                           <span className="mr-2 h-2 w-2 rounded-full bg-red-500"/>
                           Nuevos
                        </Button>
                         <Button size="sm" variant={clientFilter === 'atrasados' ? 'default' : 'outline'} className="text-xs h-7 rounded-full" onClick={() => setClientFilter('atrasados')}>
                           <span className="mr-2 h-2 w-2 rounded-full bg-red-500"/>
                           Atrasados
                        </Button>
                    </div>
                    {activeCredits.length > 0 ? activeCredits.map((credit) => (
                        <Card 
                            key={credit.id} 
                            onClick={() => handleCreditClick(credit)} 
                            className={cn(
                              "glow-card cursor-pointer overflow-hidden transition-all",
                              credit.status === 'Atrasado' ? 'border-destructive/50 ring-2 ring-destructive/20' : 'border-border',
                              credit.status === 'Al Corriente' ? 'border-green-500/50' : 'border-border'
                            )}
                        >
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-muted rounded-full"><User className="h-4 w-4 text-muted-foreground"/></div>
                                        <p className="font-bold text-sm">{credit.applicantIdentifier}</p>
                                    </div>
                                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", credit.status === 'Atrasado' ? 'bg-destructive/10 text-destructive' : 'bg-green-600/10 text-green-600')}>{credit.status}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t flex justify-between items-end">
                                    <div className="text-left">
                                        <p className="text-xs text-muted-foreground">Monto</p>
                                        <p className="font-mono text-base font-medium text-foreground">${credit.amount.toFixed(2)}</p>
                                    </div>
                                     <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Próximo pago</p>
                                        <p className="text-xs font-semibold">{format(getNextPaymentDate(credit.createdAt, credit.paymentFrequency), 'dd MMM, yyyy', { locale: es })}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                         <p className="text-center text-muted-foreground text-sm py-4">No hay créditos activos.</p>
                    )}
                </div>
            </div>
        </ScrollArea>
         {selectedCredit && (
            <CreditHistoryDialog 
                credit={selectedCredit}
                isOpen={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />
        )}
        <CompletedCreditsDialog
            isOpen={isCompletedHistoryOpen}
            onOpenChange={setIsCompletedHistoryOpen}
        />
        <CreateCreditOfferDialog 
            isOpen={isCreateOfferOpen}
            onOpenChange={setIsCreateOfferOpen}
        />
        </>
    );
};

export const ProductsView = () => {
    const { state, dispatch } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
    const [isCreateCatalogOpen, setIsCreateCatalogOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const catalogs = state.userProfile.catalogs || [];

    const handleBackToList = () => {
        setSelectedCatalogId(null);
        setSearchTerm('');
    };
    
    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsAddProductOpen(true);
    };
    
    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsAddProductOpen(true);
    };

    const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
    const filteredProducts = selectedCatalog?.products?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (!selectedCatalogId) {
        return (
            <>
                <header className="p-4 border-b bg-card/80 backdrop-blur-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold">Mis Catálogos</h1>
                        </div>
                    </div>
                </header>
                <ScrollArea className="flex-grow">
                    <div className="p-4 space-y-3">
                        {catalogs.length > 0 ? catalogs.map(catalog => {
                             const promoter = catalog.promoterType === 'user'
                                ? state.userProfile
                                : state.userProfile.assistants.find(a => a.id === catalog.promoterId);
                            const promoterName = catalog.promoterType === 'user' ? 'Tú Mismo' : promoter?.name || 'Asistente Desconocido';
                             
                             return (
                             <Card key={catalog.id} className="glow-card cursor-pointer" onClick={() => setSelectedCatalogId(catalog.id)}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        {catalog.promoterType === 'bot' ? <Bot className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{catalog.name}</p>
                                        <p className="text-xs text-muted-foreground">Promocionado por: {promoterName}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{catalog.products.length} producto(s)</p>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                         )}) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No has creado ningún catálogo.</p>
                            </div>
                         )}
                    </div>
                </ScrollArea>
                <Button
                    onClick={() => setIsCreateCatalogOpen(true)}
                    className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
                    size="icon"
                    title="Crear Nuevo Catálogo"
                >
                    <Plus className="h-6 w-6" />
                </Button>
                <CreateCatalogDialog isOpen={isCreateCatalogOpen} onOpenChange={setIsCreateCatalogOpen} />
            </>
        );
    }

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm space-y-2">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToList}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex-grow">
                         <h1 className="text-xl font-bold">{selectedCatalog?.name || 'Catálogo de Productos'}</h1>
                         <p className="text-xs text-muted-foreground">Promocionado por: {selectedCatalog?.promoterType === 'user' ? 'Tú Mismo' : state.userProfile.assistants.find(a => a.id === selectedCatalog?.promoterId)?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-10 bg-background/50 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>
             <ScrollArea className="flex-grow">
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden glow-card group relative">
                            <div className="aspect-video relative">
                                <Image src={product.imageUrl || 'https://placehold.co/600x400'} alt={product.name} layout="fill" objectFit="cover" />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(product)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-2">
                                <p className="font-semibold truncate text-sm">{product.name}</p>
                                <p className="font-bold text-primary">${product.price.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
             <Button
                onClick={handleAddProduct}
                className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
                size="icon"
                title="Añadir Producto"
            >
                <Plus className="h-6 w-6" />
            </Button>
            {selectedCatalog && (
                <AddProductDialog
                    isOpen={isAddProductOpen}
                    onOpenChange={setIsAddProductOpen}
                    catalogId={selectedCatalog.id}
                    productToEdit={editingProduct}
                />
            )}
        </>
    );
};

export const AssistantsList = () => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSwipe, setActiveSwipe] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const router = useRouter();
  const dragOccurred = useRef(false);
  const [isCreateAssistantDialogOpen, setIsCreateAssistantDialogOpen] = useState(false);
  const [isDbLinkOpen, setIsDbLinkOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isBusinessInfoOpen, setIsBusinessInfoOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<AssistantConfig | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<any | null>(null);
  
  const assistantsToShow: (AssistantConfig | UserProfile)[] = useMemo(() => {
    const assistantChats = userProfile.assistants;
    return assistantChats;
  }, [userProfile.assistants]);

  const filteredChats = assistantsToShow.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateAssistant = () => {
    setIsCreateAssistantDialogOpen(true);
  };
  
  const handleDatabaseLink = (assistant: any) => {
    setSelectedAssistant(assistant);
    setIsDbLinkOpen(true);
  };
  
  const handleInstructionsEdit = (assistant: any) => {
    setSelectedAssistant(assistant);
    setIsInstructionsOpen(true);
  };
  
  const handleBusinessInfoEdit = (assistant: any) => {
    setSelectedAssistant(assistant);
    setIsBusinessInfoOpen(true);
  }

  const handleToggleIA = async (assistant: AssistantConfig) => {
    if (!userProfile.isAuthenticated) {
        toast({ title: "Modo Demo", description: "Esta acción no está disponible en modo demostración."});
        return;
    }
    try {
        const response = await fetch('/api/assistants/toggle-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assistantId: assistant.id,
                userId: userProfile._id?.toString(),
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'No se pudo cambiar el estado.');
        }

        dispatch({ type: 'UPDATE_ASSISTANT', payload: result.updatedAssistant });
        toast({
            title: "Estado Actualizado",
            description: `La IA para "${assistant.name}" ha sido ${result.updatedAssistant.isActive ? 'activada' : 'desactivada'}.`
        });

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  const handleDeleteAssistant = (assistant: AssistantConfig) => {
    setAssistantToDelete(assistant);
    setIsDeleteAlertOpen(true);
  }
  
  const confirmDelete = () => {
    if(assistantToDelete) {
        dispatch({ type: 'REMOVE_ASSISTANT', payload: assistantToDelete.id });
        toast({
            title: "Asistente Eliminado",
            description: `El asistente "${assistantToDelete.name}" ha sido eliminado.`,
        });
        setAssistantToDelete(null);
    }
    setIsDeleteAlertOpen(false);
  }
  
  return (
    <>
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Supervisión de Bots</h1>
                </div>
            </div>
        </div>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o asistente..."
              className="pl-10 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>

      <ScrollArea className="flex-grow min-h-0" onClick={() => setActiveSwipe(null)}>
         <div className="p-2 space-y-2">
          {filteredChats.length > 0 ? filteredChats.map((chat) => {
            const isLeftSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'left';
            const isRightSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'right';
            const isAssistant = 'prompt' in chat;

            return (
              <div key={chat.id} className="relative rounded-lg overflow-hidden bg-muted/30">
                <AnimatePresence>
                    {isLeftSwiped && isAssistant && (
                        <motion.div
                            key="actions-left"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 right-0 flex items-center"
                        >
                            <div className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none cursor-pointer" onClick={() => handleDeleteAssistant(chat as AssistantConfig)}>
                                <Trash2 size={20}/>
                                <span className="text-xs mt-1">Borrar</span>
                            </div>
                        </motion.div>
                    )}
                    {isRightSwiped && isAssistant && (
                         <motion.div
                            key="actions-right"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 left-0 flex items-center"
                        >
                             <div className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5 cursor-pointer" onClick={() => handleInstructionsEdit(chat)}>
                                <BookText size={20}/>
                                <span className="text-xs">Instrucciones</span>
                            </div>
                            <div 
                                className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-purple-500/20 hover:bg-purple-500/30 rounded-none gap-0.5 cursor-pointer"
                                onClick={() => handleDatabaseLink(chat)}
                            >
                                <Database size={20}/>
                                <span className="text-xs">Base de datos</span>
                            </div>
                            <div 
                                className={cn("h-full w-24 flex flex-col items-center justify-center text-muted-foreground rounded-none gap-0.5 cursor-pointer",
                                    chat.isActive ? "bg-red-500/20 hover:bg-red-500/30" : "bg-green-500/20 hover:bg-green-500/30"
                                )} 
                                onClick={() => handleToggleIA(chat as AssistantConfig)}
                            >
                                <Bot size={20}/>
                                <span className="text-xs">{chat.isActive ? 'Desactivar IA' : 'Activar IA'}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: isAssistant ? -80 : 0, right: isAssistant ? 288 : 0 }}
                    onDragStart={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = false;
                    }}
                    onDrag={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = true;
                    }}
                    onDragEnd={(event, info) => {
                        if (!isAssistant) return;
                        const isSwipeLeft = info.offset.x < -60;
                        const isSwipeRight = info.offset.x > 60;
                        if (isSwipeLeft) {
                            setActiveSwipe({ id: chat.id!, direction: 'left' });
                        } else if (isSwipeRight) {
                             setActiveSwipe({ id: chat.id!, direction: 'right' });
                        } else {
                            setActiveSwipe(null);
                        }
                    }}
                    onClick={(e) => {
                        if (activeSwipe) {
                            e.stopPropagation();
                            setActiveSwipe(null);
                            return;
                        }
                        if (dragOccurred.current) { e.stopPropagation(); return; }
                        if (chat.chatPath) {
                            router.push(`/chat/conversation/${chat.chatPath}`);
                        } else {
                            toast({
                                title: "Chat no disponible",
                                description: "Este asistente aún no tiene una página de chat asignada.",
                                variant: "default"
                            });
                        }
                    }}
                    animate={{ 
                        x: isLeftSwiped ? -80 : isRightSwiped ? 288 : 0 
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative z-10 cursor-grab active:cursor-grabbing bg-card rounded-lg"
                >
                     <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg bg-transparent">
                        <CardContent className="p-3 flex items-center gap-3">
                            <motion.div
                                animate={{ y: [-1, 1, -1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Avatar className="h-12 w-12 border-2 border-primary/30">
                                    <AvatarImage src={chat.imageUrl} alt={chat.name} />
                                    <AvatarFallback className="text-lg bg-muted">
                                        {chat.name ? chat.name.charAt(0) : <User />}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>
                            <div className="flex-grow overflow-hidden">
                            <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate text-sm">{chat.name}</p>
                                        <div className="p-1 bg-muted rounded-full">
                                            {isAssistant ? <Bot className="h-3 w-3 text-muted-foreground"/> : <User className="h-3 w-3 text-muted-foreground"/>}
                                        </div>
                                    </div>
                            </div>
                            <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("relative flex h-2 w-2")}>
                                            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", chat.isActive ? "bg-green-400 animate-ping" : "bg-gray-400")}></span>
                                            <span className={cn("relative inline-flex rounded-full h-2 w-2", chat.isActive ? "bg-green-500" : "bg-gray-500")}></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">{chat.isActive ? 'en línea' : 'desconectado'}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">{ (chat as any).timestamp || 'Reciente'}</p>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
              </div>
            )
          }) : (
             <div className="text-center py-20 px-4 text-muted-foreground">
                <p className="font-semibold">No se encontraron chats.</p>
                <p className="text-sm">
                    {searchTerm ? "Intenta con otra búsqueda." : "Los chats activos de los clientes aparecerán aquí."}
                </p>
            </div>
           )}
        </div>
      </ScrollArea>
       <Button
            onClick={handleCreateAssistant}
            className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
            size="icon"
            title="Crear nuevo asistente"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
       <CreateAssistantDialog isOpen={isCreateAssistantDialogOpen} onOpenChange={setIsCreateAssistantDialogOpen} />
       {selectedAssistant && (
         <DatabaseLinkDialog 
            isOpen={isDbLinkOpen} 
            onOpenChange={setIsDbLinkOpen} 
            assistantId={selectedAssistant.id} 
         />
       )}
       {selectedAssistant && (
        <InstructionsDialog
            isOpen={isInstructionsOpen}
            onOpenChange={setIsInstructionsOpen}
            assistant={selectedAssistant}
        />
       )}
       {selectedAssistant && (
        <BusinessInfoDialog
            isOpen={isBusinessInfoOpen}
            onOpenChange={setIsBusinessInfoOpen}
            assistant={selectedAssistant}
        />
       )}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el asistente "{assistantToDelete?.name}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Eliminar
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
}

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
