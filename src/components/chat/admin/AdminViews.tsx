// src/components/chat/admin/AdminViews.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign, Crown, Database, BookText, Percent, Calendar, Edit, ArrowRight, ArrowLeft, Truck, Store, Wallet, Send, Building, CheckCircle, Loader2, CheckSquare, History } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import DatabaseLinkDialog from './DatabaseLinkDialog';
import InstructionsDialog from './InstructionsDialog';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { AssistantConfig, ChatMessage, Product, Catalog } from '@/types';
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

// --- IndexedDB Helper Functions (replicated for this component) ---
const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 2; // Make sure this matches your db.ts
const MESSAGES_STORE_NAME = 'messages';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction;
        if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
            db.createObjectStore(MESSAGES_STORE_NAME, { autoIncrement: true });
        }
        if (transaction) {
            const messagesStore = transaction.objectStore(MESSAGES_STORE_NAME);
            if (!messagesStore.indexNames.contains('by_sessionId')) {
                messagesStore.createIndex('by_sessionId', 'sessionId');
            }
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

interface StoredMessage extends ChatMessage {
    sessionId: string;
    // IndexedDB adds a key property when using autoIncrement
    id?: number; 
}

// Function to get all messages from all sessions
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
    },
    {
        id: 'user-2',
        name: 'Usuario B - Asistente de Soporte',
        isActive: false,
        type: 'whatsapp',
        messageCount: 0,
        monthlyMessageLimit: 0,
        purposes: [],
    },
];

const ReceiptDialog = ({ payment, isOpen, onOpenChange, onAction }: { payment: any | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onAction?: (id: string, action: 'authorize' | 'reject') => void }) => {
    if (!payment) return null;

    const isVideo = payment.receiptUrl.startsWith('data:video');
    const isAudio = payment.receiptUrl.startsWith('data:audio');
    const isImage = payment.receiptUrl.startsWith('data:image');
    const isPDF = payment.receiptUrl.includes('application/pdf');

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 flex flex-col bg-background">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Revisar Comprobante</DialogTitle>
                    <DialogDescription>
                        Recibido de {payment.userName} el {format(new Date(payment.receivedAt), "PPPp", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-auto p-4 flex items-center justify-center">
                    {isImage && <Image src={payment.receiptUrl} alt="Comprobante" width={800} height={1200} className="rounded-md border max-w-full h-auto" />}
                    {isVideo && <video src={payment.receiptUrl} controls className="rounded-md border max-w-full h-auto" />}
                    {isAudio && <audio src={payment.receiptUrl} controls className="w-full" />}
                    {(isPDF || (!isImage && !isVideo && !isAudio)) && (
                        <div className="text-center p-8 bg-muted rounded-lg">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
                            <p className="font-semibold">Documento: {payment.fileName || 'archivo'}</p>
                            <p className="text-sm text-muted-foreground mb-4">La previsualización no está disponible.</p>
                            <a href={payment.receiptUrl} download={payment.fileName || 'documento'}>
                                <Button>Descargar Archivo</Button>
                            </a>
                        </div>
                    )}
                </div>
                {onAction && (
                    <DialogFooter className="p-4 bg-background border-t flex justify-end gap-2">
                        <Button variant="destructive" onClick={() => onAction(payment.id, 'reject')}><XCircle className="mr-2"/> Rechazar</Button>
                        <Button variant="default" onClick={() => onAction(payment.id, 'authorize')} className="bg-green-600 hover:bg-green-700"><Check className="mr-2"/> Autorizar</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};


export const BankView = () => {
    const { state } = useApp();
    const { assistants } = state.userProfile;
    const { toast } = useToast();
    const [allPayments, setAllPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const allMessages = await getAllMessagesFromDB();
            const mediaMessages = allMessages
                .filter(msg => msg.role === 'user' && typeof msg.content === 'object' && ['image', 'video', 'audio', 'document'].includes(msg.content.type))
                .map((msg, index) => {
                    const assistant = assistants.find(a => a.chatPath && msg.sessionId.includes(a.chatPath))
                    const content = msg.content as { type: string, url: string, name?: string };
                    return {
                        id: msg.id?.toString() || `media-${index}`,
                        product: `Comprobante (${content.type})`,
                        fileName: content.name,
                        assistantName: assistant?.name || 'Desconocido',
                        userName: `Usuario ${msg.sessionId.slice(-6)}`,
                        chatPath: msg.sessionId,
                        amount: 0.00, // Amount is unknown from just an image
                        receiptUrl: content.url,
                        receivedAt: new Date(), // Using current date as placeholder
                        status: 'pending', // All found images are pending initially
                    };
                });
            setAllPayments(mediaMessages);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudieron cargar los comprobantes desde la base de datos local.', variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [assistants, toast]);
    
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
    
    const handleAction = (id: string, action: 'authorize' | 'reject') => {
        setAllPayments(prev => prev.filter(p => p.id !== id));
        setIsReceiptOpen(false);
        toast({
            title: `Acción Realizada`,
            description: `El comprobante ha sido ${action === 'authorize' ? 'autorizado' : 'rechazado'}.`
        });
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
                 <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground font-normal text-sm">Ingreso Total (Autorizado)</p>
                        <p className="text-4xl font-extrabold text-foreground mt-1">
                            ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
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

            <ScrollArea className="flex-grow px-2">
                <div className="p-2 space-y-3">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                            <Eye className="mr-2"/>Ver Comprobante
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

const CreditHistoryDialog = ({ credit, isOpen, onOpenChange }: { credit: any | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

    const paymentHistory = useMemo(() => {
        if (!credit) return [];
        return [
            { id: 1, date: '2024-07-28', amount: 500, receiptUrl: 'https://placehold.co/600x800.png', userName: credit.client },
            { id: 2, date: '2024-07-21', amount: 500, receiptUrl: 'https://placehold.co/600x800.png', userName: credit.client },
        ];
    }, [credit]);
    
    if (!credit) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="w-screen h-screen max-w-full flex flex-col">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Historial de Crédito: {credit.client}</DialogTitle>
                        <DialogDescription>Revisa los detalles y pagos de esta línea de crédito.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-grow">
                        <div className="p-4 space-y-4">
                            <Card>
                                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Monto Total</p>
                                        <p className="text-2xl font-bold">${credit.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estado</p>
                                        <p className={cn("text-2xl font-bold", credit.status === 'Atrasado' ? 'text-destructive' : 'text-green-600')}>{credit.status}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div>
                                <h4 className="font-semibold mb-2">Historial de Pagos</h4>
                                <div className="space-y-2">
                                    {paymentHistory.map(payment => (
                                        <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold">${payment.amount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(payment.date), 'dd MMM, yyyy', { locale: es })}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(payment)}>
                                                <Eye className="mr-2 h-4 w-4"/> Ver Comprobante
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ReceiptDialog 
                payment={selectedReceipt}
                isOpen={!!selectedReceipt}
                onOpenChange={(open) => !open && setSelectedReceipt(null)}
            />
        </>
    )
}

const CompletedCreditsDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    // Demo data for completed credits
    const completedCredits = [
        { id: 4, client: 'Cliente D', amount: 1500, completedDate: '2024-07-15' },
        { id: 5, client: 'Cliente E', amount: 2000, completedDate: '2024-06-30' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col">
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
                                            <p className="font-semibold text-sm">{credit.client}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Completado el {format(new Date(credit.completedDate), 'dd MMM, yyyy', { locale: es })}
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

const CreateCreditOfferDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { state } = useApp();
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const [interest, setInterest] = useState('');
    const [term, setTerm] = useState('');
    const [assistantId, setAssistantId] = useState<string | undefined>();

    const assistants = state.userProfile.assistants || [];

    const handleCreate = () => {
        // Validation
        if (!amount || !interest || !term || !assistantId) {
            toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos para crear la oferta.", variant: "destructive" });
            return;
        }
        // TODO: API call to save the new credit offer
        toast({ title: "Oferta Creada", description: "La nueva oferta de crédito ha sido creada y asignada." });
        onOpenChange(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Nueva Oferta de Crédito</DialogTitle>
                    <DialogDescription>Define los términos y asigna un asistente para gestionar esta oferta.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto Máximo del Crédito</Label>
                        <Input id="amount" type="number" placeholder="Ej: 5000" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="interest">Tasa de Interés Mensual (%)</Label>
                        <Input id="interest" type="number" placeholder="Ej: 10" value={interest} onChange={e => setInterest(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="term">Plazo (meses)</Label>
                        <Input id="term" type="number" placeholder="Ej: 12" value={term} onChange={e => setTerm(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="assistant">Asistente Gestor</Label>
                        <Select onValueChange={setAssistantId} value={assistantId}>
                            <SelectTrigger id="assistant">
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleCreate}>Crear Oferta</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CreditOfferCarousel = ({ onAdd }: { onAdd: () => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const creditOffers = [
        { maxAmount: 5000, interestRate: 10, term: 12 },
        { maxAmount: 10000, interestRate: 8, term: 24 },
        { maxAmount: 2000, interestRate: 12, term: 6 },
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setActiveIndex(newIndex);
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="w-full relative">
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2"
            >
                {creditOffers.map((offer, index) => (
                    <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                        <Card className="bg-gradient-to-tr from-blue-900 via-purple-900 to-blue-900 text-white shadow-2xl relative overflow-hidden">
                            <motion.div
                                className="absolute -top-1/4 -right-1/4 w-1/2 h-full bg-white/10 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            />
                            <div className="absolute inset-0 bg-black/20"/>
                            <CardContent className="p-4 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardDescription className="text-blue-200 text-xs">Oferta de Crédito</CardDescription>
                                        <CardTitle className="text-3xl font-bold text-white drop-shadow-lg">${offer.maxAmount.toLocaleString()}</CardTitle>
                                        <p className="text-blue-200 text-xs">Monto Máximo</p>
                                    </div>
                                    <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white h-7 text-xs px-2" disabled>
                                        <Edit className="mr-1 h-3 w-3"/>
                                        Editar
                                    </Button>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1">
                                        <Percent className="h-3 w-3 text-blue-300"/>
                                        <span>Tasa: {offer.interestRate}%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-blue-300"/>
                                        <span>Plazo: {offer.term} meses</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-2 space-x-2">
                {creditOffers.map((_, index) => (
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
            <Button size="icon" variant="outline" className="h-8 w-8 absolute top-2 right-2 bg-background/50" onClick={onAdd}>
                <Plus className="h-4 w-4"/>
            </Button>
        </div>
    );
};


export const CreditView = () => {
    const { toast } = useToast();
    const [selectedCredit, setSelectedCredit] = useState<any | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isCompletedHistoryOpen, setIsCompletedHistoryOpen] = useState(false);
    const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);

    const activeCredits = [
        { id: 1, client: 'Cliente A', amount: 2500, status: 'Al Corriente', nextPayment: '2024-08-15' },
        { id: 2, client: 'Cliente B', amount: 1000, status: 'Al Corriente', nextPayment: '2024-08-10' },
        { id: 3, client: 'Cliente C', amount: 3000, status: 'Atrasado', nextPayment: '2024-07-30' },
    ];
    
    const handleCreditClick = (credit: any) => {
        setSelectedCredit(credit);
        setIsHistoryOpen(true);
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
            </div>
        </header>
        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-6">
                <CreditOfferCarousel onAdd={() => setIsCreateOfferOpen(true)} />

                 <Card>
                    <CardHeader>
                        <CardTitle>Créditos Activos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activeCredits.map((credit) => (
                            <div key={credit.id} onClick={() => handleCreditClick(credit)} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted">
                                <div className="space-y-0.5">
                                    <p className="font-semibold text-sm">{credit.client}</p>
                                    <p className="text-xs text-muted-foreground">Próx. pago: {format(new Date(credit.nextPayment), 'dd MMM, yyyy', { locale: es })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">${credit.amount.toFixed(2)}</p>
                                    <span className={cn("text-xs font-semibold", credit.status === 'Atrasado' ? 'text-destructive' : 'text-green-600')}>{credit.status}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <div className="pt-4">
                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsCompletedHistoryOpen(true)}
                    >
                        <History className="mr-2 h-4 w-4" />
                        Ver Historial de Créditos
                    </Button>
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

const AddProductDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [shippingMethod, setShippingMethod] = useState<'local' | 'delivery' | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);

    const handleImageUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const renderStepContent = () => {
        switch(step) {
            case 1:
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Nombre del Producto</Label>
                            <Input id="product-name" placeholder="Ej: Pastel de Tres Leches" value={productName} onChange={e => setProductName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="product-price">Precio</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="product-price" type="number" placeholder="Ej: 250.00" className="pl-9" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Imagen del Producto</Label>
                             <div
                                onClick={handleImageUploadClick}
                                className="aspect-video w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors bg-muted/50"
                            >
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Vista previa" width={200} height={112} className="object-cover rounded-md" />
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 mb-2" />
                                        <p className="text-sm">Subir imagen</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4 animate-fadeIn">
                         <h3 className="text-lg font-semibold text-center">Método de Envío</h3>
                         <div className="grid grid-cols-2 gap-4">
                             <Card onClick={() => setShippingMethod('local')} className={cn("cursor-pointer transition-all", shippingMethod === 'local' && "border-primary ring-2 ring-primary")}>
                                 <CardContent className="p-6 text-center space-y-2">
                                     <Store className="h-8 w-8 mx-auto text-primary"/>
                                     <p className="font-semibold">Ir a local</p>
                                 </CardContent>
                             </Card>
                             <Card onClick={() => setShippingMethod('delivery')} className={cn("cursor-pointer transition-all", shippingMethod === 'delivery' && "border-primary ring-2 ring-primary")}>
                                 <CardContent className="p-6 text-center space-y-2">
                                     <Truck className="h-8 w-8 mx-auto text-primary"/>
                                     <p className="font-semibold">Mandadito</p>
                                 </CardContent>
                             </Card>
                         </div>
                     </div>
                )
            case 3:
                 return (
                     <div className="space-y-4 animate-fadeIn">
                         <h3 className="text-lg font-semibold text-center">Método de Pago</h3>
                         <div className="grid grid-cols-2 gap-4">
                              <Card onClick={() => setPaymentMethod('cash')} className={cn("cursor-pointer transition-all", paymentMethod === 'cash' && "border-primary ring-2 ring-primary")}>
                                 <CardContent className="p-6 text-center space-y-2">
                                     <Wallet className="h-8 w-8 mx-auto text-primary"/>
                                     <p className="font-semibold">Pagar a repartidor</p>
                                 </CardContent>
                             </Card>
                              <Card onClick={() => setPaymentMethod('transfer')} className={cn("cursor-pointer transition-all", paymentMethod === 'transfer' && "border-primary ring-2 ring-primary")}>
                                 <CardContent className="p-6 text-center space-y-2">
                                     <Send className="h-8 w-8 mx-auto text-primary"/>
                                     <p className="font-semibold">Pagar transferencia</p>
                                 </CardContent>
                             </Card>
                         </div>
                     </div>
                )
            default:
                return null;
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-screen h-screen max-w-full flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Sigue los pasos para añadir un producto a tu catálogo. (Paso {step} de 3)
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 flex-grow overflow-y-auto px-6">
                    {renderStepContent()}
                </div>
                <DialogFooter className="flex justify-between w-full p-4 border-t">
                    {step > 1 ? (
                        <Button variant="outline" onClick={prevStep}><ArrowLeft className="mr-2 h-4 w-4"/> Atrás</Button>
                    ) : <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>}

                    {step < 3 ? (
                        <Button onClick={nextStep}>Siguiente <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    ) : (
                        <Button onClick={() => onOpenChange(false)}>Guardar Producto</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CreateCatalogDialog = ({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
    const { state } = useApp();
    const [catalogName, setCatalogName] = useState('');
    const [selectedPromoter, setSelectedPromoter] = useState<string>('owner'); // 'owner' or assistant id
    const assistants = state.userProfile.assistants || [];
  
    const promoterOptions = useMemo(() => [
      { id: 'owner', name: 'Tú Mismo', imageUrl: state.userProfile.imageUrl },
      ...assistants
    ], [assistants, state.userProfile.imageUrl]);
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Catálogo</DialogTitle>
            <DialogDescription>
              Define el nombre y el promotor de tu nuevo catálogo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            <div className="px-1 space-y-2">
              <Label htmlFor="catalog-name">Nombre del Catálogo</Label>
              <Input id="catalog-name" placeholder="Ej: Menú de Fin de Semana" value={catalogName} onChange={e => setCatalogName(e.target.value)} />
            </div>
            <div className="px-1 space-y-2">
              <Label>¿Quién promocionará este catálogo?</Label>
              <RadioGroup value={selectedPromoter} onValueChange={setSelectedPromoter} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {promoterOptions.map((promoter) => (
                      <Label key={promoter.id} htmlFor={`promoter-${promoter.id}`} className={cn("p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all", selectedPromoter === promoter.id ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground")}>
                          <RadioGroupItem value={promoter.id} id={`promoter-${promoter.id}`} />
                          <Avatar className="h-10 w-10">
                              <AvatarImage src={promoter.imageUrl} />
                              <AvatarFallback>
                                  {promoter.id === 'owner' ? <User /> : <Bot />}
                              </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm truncate">{promoter.name}</span>
                      </Label>
                  ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onOpenChange(false)}>Crear Catálogo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

export const ProductsView = () => {
    const { state } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [isCreateCatalogDialogOpen, setIsCreateCatalogDialogOpen] = useState(false);
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
    const { toast } = useToast();

    const isMember = state.userProfile.accountType === 'business';
    const catalogs = state.userProfile.catalogs || [];

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
    };

    const handleBackToList = () => {
        setSelectedCatalogId(null);
        setSearchTerm('');
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
                            <div>
                                <h1 className="text-xl font-bold">Mis Catálogos</h1>
                            </div>
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
                             <Card key={catalog.id} className="glow-card cursor-pointer" onClick={() => handleSelectCatalog(catalog.id)}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        {catalog.promoterType === 'bot' ? <Bot className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{catalog.name}</p>
                                        <p className="text-xs text-muted-foreground">Promocionado por: {promoterName}</p>
                                    </div>
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
                    onClick={() => setIsCreateCatalogDialogOpen(true)}
                    className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
                    size="icon"
                    title="Crear Nuevo Catálogo"
                >
                    <Plus className="h-6 w-6" />
                </Button>
                <CreateCatalogDialog isOpen={isCreateCatalogDialogOpen} onOpenChange={setIsCreateCatalogDialogOpen} />
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
                    <Button variant="outline" size="sm" className="h-9">Definir Catálogo</Button>
                    {isMember && (
                        <Button size="sm" className="h-9 bg-brand-gradient text-primary-foreground hover:opacity-90" onClick={() => {toast({ title: 'Próximamente', description: 'Creación de múltiples catálogos estará disponible pronto.'})}}>
                            <Plus className="mr-1 h-4 w-4"/>
                            Crear Catálogo
                        </Button>
                    )}
                </div>
            </header>
             <ScrollArea className="flex-grow">
                <div className="p-4 grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden glow-card">
                            <div className="aspect-video relative">
                                <Image src={product.imageUrl || 'https://placehold.co/600x400'} alt={product.name} layout="fill" objectFit="cover" />
                            </div>
                            <CardContent className="p-3">
                                <p className="font-semibold truncate text-sm">{product.name}</p>
                                <p className="font-bold text-primary">${product.price.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
             <Button
                onClick={() => setIsAddProductDialogOpen(true)}
                className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
                size="icon"
                title="Añadir Producto"
            >
                <Plus className="h-6 w-6" />
            </Button>
            <AddProductDialog isOpen={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen} />
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
  
  const assistantsToShow = useMemo(() => {
    if (userProfile.isAuthenticated) {
        return userProfile.assistants;
    }
    // In demo mode, show both created (in-memory) assistants and demo chats
    return [...userProfile.assistants, ...demoAdminChats];
  }, [userProfile.isAuthenticated, userProfile.assistants]);

  const filteredChats = assistantsToShow.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
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

      <ScrollArea className="flex-grow" onClick={() => setActiveSwipe(null)}>
         <div className="p-2 space-y-2">
          {filteredChats.length > 0 ? filteredChats.map((chat) => {
            const isLeftSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'left';
            const isRightSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'right';

            return (
              <div key={chat.id} className="relative rounded-lg overflow-hidden bg-muted/30">
                <AnimatePresence>
                    {isLeftSwiped && (
                        <motion.div
                            key="actions-left"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 right-0 flex items-center"
                        >
                            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none" onClick={() => handleDeleteAssistant(chat)}>
                                <Trash2 size={20}/>
                                <span className="text-xs mt-1">Borrar</span>
                            </Button>
                        </motion.div>
                    )}
                    {isRightSwiped && (
                         <motion.div
                            key="actions-right"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 left-0 flex items-center"
                        >
                            <Button variant="ghost" className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5" onClick={() => handleInstructionsEdit(chat)}>
                                <BookText size={20}/>
                                <span className="text-xs">Instrucciones</span>
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-purple-500/20 hover:bg-purple-500/30 rounded-none gap-0.5"
                                onClick={() => handleDatabaseLink(chat)}
                            >
                                <Database size={20}/>
                                <span className="text-xs">Base de datos</span>
                            </Button>
                            <Button 
                                variant="ghost" 
                                className={cn("h-full w-24 flex flex-col items-center justify-center text-muted-foreground rounded-none gap-0.5",
                                    chat.isActive ? "bg-red-500/20 hover:bg-red-500/30" : "bg-green-500/20 hover:bg-green-500/30"
                                )} 
                                onClick={() => handleToggleIA(chat as AssistantConfig)}
                            >
                                <Bot size={20}/>
                                <span className="text-xs">{chat.isActive ? 'Desactivar IA' : 'Activar IA'}</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -80, right: 288 }}
                    onDragStart={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = false;
                    }}
                    onDrag={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = true;
                    }}
                    onDragEnd={(event, info) => {
                        const isSwipeLeft = info.offset.x < -60;
                        const isSwipeRight = info.offset.x > 60;
                        if (isSwipeLeft) {
                            setActiveSwipe({ id: chat.id, direction: 'left' });
                        } else if (isSwipeRight) {
                             setActiveSwipe({ id: chat.id, direction: 'right' });
                        } else {
                            setActiveSwipe(null);
                        }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (dragOccurred.current) {
                            return;
                        }
                        setActiveSwipe(null);
                        handleBusinessInfoEdit(chat);
                    }}
                    animate={{ 
                        x: isLeftSwiped ? -80 : isRightSwiped ? 288 : 0 
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative z-10 cursor-grab active:cursor-grabbing"
                >
                    <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg">
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
                                    <p className="font-semibold truncate text-sm">{chat.name}</p>
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
