
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign, Crown, Database, BookText, Percent, Calendar, Edit, ArrowRight, ArrowLeft, Truck, Store, Wallet, Send, Building, CheckCircle, Loader2, CheckSquare, History, Radio, Palette, Image as ImageIcon, Briefcase, Landmark, MapPin, Video, FileAudio } from 'lucide-react';
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
import type { AssistantConfig, ChatMessage, Product, Catalog, CreditLine, CreditOffer, UserProfile, RequiredDocument, Delivery, Authorization } from '@/types';
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
import ReceiptDialog from './ReceiptDialog';
import { Badge } from '@/components/ui/badge';
import AddProductDialog from './AddProductDialog';
import CreateCatalogDialog from './CreateCatalogDialog';
import ConversationsDialog from '@/components/dashboard/ConversationsDialog';
import CreditHistoryDialog from './CreditHistoryDialog';


// --- IndexedDB Helper Functions (replicated for this component) ---


interface StoredMessage extends ChatMessage {
    sessionId: string;
    // IndexedDB adds a keyPath property when using autoIncrement
    id?: number; 
}


export const BankView = () => {
    const { state, dispatch } = useApp();
    const { assistants, isAuthenticated } = state.userProfile;
    const { toast } = useToast();
    const [allAuthorizations, setAllAuthorizations] = useState<Authorization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

    useEffect(() => {
        setIsLoading(true);
        const authorizations = (assistants || []).flatMap(a => 
            (a.authorizations || []).map(auth => ({ ...auth, assistantName: a.name, assistantId: a.id }))
        );
        setAllAuthorizations(authorizations.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()));
        setIsLoading(false);
    }, [assistants]);

    const filteredPayments = useMemo(() => {
        return allAuthorizations.filter(p => p.status === filter);
    }, [filter, allAuthorizations]);

    const totalIncome = useMemo(() => {
        return allAuthorizations.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    }, [allAuthorizations]);
    
    const pendingCount = useMemo(() => {
        return allAuthorizations.filter(p => p.status === 'pending').length;
    }, [allAuthorizations]);

    const handleViewReceipt = (payment: any) => {
        setSelectedPayment(payment);
        setIsReceiptOpen(true);
    };
    
    const handleAction = async (authId: string, assistantId: string, action: 'completed' | 'rejected', amount?: number) => {
      try {
          const response = await fetch('/api/authorizations', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ authorizationId: authId, assistantId, status: action, amount }),
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al actualizar la autorización');
          }
          
          // Optimistic update on the frontend
          const updatedAssistants = assistants.map(asst => {
              if (asst.id === assistantId) {
                  return {
                      ...asst,
                      authorizations: (asst.authorizations || []).map(auth => 
                          auth.id === authId ? { ...auth, status: action, amount: action === 'completed' ? amount || auth.amount : auth.amount } : auth
                      )
                  };
              }
              return asst;
          });
  
          dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: updatedAssistants as any } });
          toast({ title: 'Éxito', description: `El comprobante ha sido ${action === 'completed' ? 'aprobado' : 'rechazado'}.` });
  
      } catch (error: any) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } finally {
          setIsReceiptOpen(false);
      }
    };
    
    const getFileIcon = (receiptUrl: string) => {
        if (receiptUrl.startsWith('data:video')) return <Video className="h-5 w-5 text-muted-foreground"/>;
        if (receiptUrl.startsWith('data:audio')) return <FileAudio className="h-5 w-5 text-muted-foreground"/>;
        return <ImageIcon className="h-5 w-5 text-muted-foreground"/>;
    }


    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <CheckSquare className="h-6 w-6 text-green-500" />
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
                            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                            <p className="mt-2 text-sm">Cargando comprobantes...</p>
                        </div>
                    ) : filteredPayments.length > 0 ? filteredPayments.map(payment => (
                         <Card key={payment.id} className="glow-card">
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-muted rounded-full">
                                            {getFileIcon(payment.receiptUrl)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm">{payment.userName}</p>
                                            <p className="text-xs text-muted-foreground">{payment.assistantName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {payment.amount > 0 && <p className="font-bold text-green-500">${payment.amount.toFixed(2)}</p>}
                                        <p className="text-xs text-muted-foreground">{new Date(payment.receivedAt).toLocaleString()}</p>
                                    </div>
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
                onAction={(action: 'completed' | 'rejected', amount?: number) => handleAction(selectedPayment.id, selectedPayment.assistantId, action, amount)}
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

    const getManagerName = (managerType: 'user' | 'assistant', managerId: string) => {
        if (managerType === 'user') {
            return state.userProfile.firstName || 'Yo';
        }
        return state.userProfile.assistants.find(a => a.id === managerId)?.name || 'Asistente';
    };

    return (
        <div className="w-full">
            <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2">
                {creditOffers.map((offer) => {
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
                                    <div className="flex items-center gap-1.5">
                                        {offer.cardIconUrl ? <Image src={offer.cardIconUrl} alt="Card Icon" width={16} height={16} className="brightness-0 invert"/> : <AppIcon className="h-4 w-4 brightness-0 invert"/>}
                                        <span className="font-semibold text-xs">{getManagerName(offer.managerType, offer.managerId)}</span>
                                    </div>
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
    const [cardIconUrl, setCardIconUrl] = useState<string | null>(null);
    const [managerType, setManagerType] = useState<'user' | 'assistant'>('user');
    const [managerId, setManagerId] = useState<string>('');
    const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
    const [newDocTitle, setNewDocTitle] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const assistants = state.userProfile.assistants || [];
    const totalSteps = 7;

    useEffect(() => {
        if (managerType === 'user') {
            setManagerId(state.userProfile._id?.toString() || '');
        } else {
            setManagerId('');
        }
    }, [managerType, state.userProfile._id]);
    
    const handleNext = () => {
        if (step === 1 && !name) return toast({ title: "Campo requerido", description: "Por favor, ingresa un nombre para la oferta.", variant: "destructive" });
        if (step === 2 && !amount) return toast({ title: "Campo requerido", description: "Por favor, ingresa un monto.", variant: "destructive" });
        if (step === 3 && !interest) return toast({ title: "Campo requerido", description: "Por favor, ingresa una tasa de interés.", variant: "destructive" });
        if (step === 4 && !term) return toast({ title: "Campo requerido", description: "Por favor, ingresa un plazo.", variant: "destructive" });
        if (step === 5 && requiredDocuments.length === 0) return toast({ title: "Campo requerido", description: "Añade al menos un documento requerido.", variant: "destructive" });
        if (step === 6 && !cardStyle) return toast({ title: "Campo requerido", description: "Por favor, selecciona un estilo.", variant: "destructive" });
        if (step === 7 && !managerId) return toast({ title: "Campo requerido", description: "Por favor, selecciona un gestor.", variant: "destructive" });
        setStep(s => s + 1);
    };
    const handleBack = () => setStep(s => s - 1);
    
    const handleCreate = () => {
        if (!name || !amount || !interest || !term || !managerId || requiredDocuments.length === 0) {
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
            cardIconUrl: cardIconUrl || undefined,
            managerType: managerType,
            managerId: managerId,
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

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        // set white, but preserve alpha
                        data[i] = 255;     // red
                        data[i + 1] = 255; // green
                        data[i + 2] = 255; // blue
                    }
                    ctx.putImageData(imageData, 0, 0);
                    setCardIconUrl(canvas.toDataURL('image/png'));
                };
                img.src = event.target?.result as string;
            };
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
                                <div className="flex items-center gap-1.5">
                                    {cardIconUrl ? <Image src={cardIconUrl} alt="Card Icon" width={16} height={16} className="brightness-0 invert"/> : <AppIcon className="h-4 w-4 brightness-0 invert"/>}
                                    <span className="font-semibold text-xs">{getManagerName(managerType, managerId)}</span>
                                </div>
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
                                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => iconInputRef.current?.click()}>
                                    <AppIcon className="h-4 w-4"/>
                                 </Button>
                                 <input type="file" ref={iconInputRef} accept="image/png" className="hidden" onChange={handleIconUpload}/>
                            </div>
                        </div>
                    </div>
                );
            case 7: 
                return (
                <div className="space-y-2">
                    <Label className="text-base">Gestor del Crédito</Label>
                    <RadioGroup value={managerType} onValueChange={(v) => setManagerType(v as 'user' | 'assistant')} className="space-y-2">
                        <Label htmlFor="manager-user" className={cn("flex items-center gap-3 p-3 border rounded-md cursor-pointer", managerType === 'user' && "bg-primary/10 border-primary")}>
                            <RadioGroupItem value="user" id="manager-user" />
                            <User className="h-5 w-5" />
                            <span>Yo mismo</span>
                        </Label>
                        <Label htmlFor="manager-assistant" className={cn("flex items-center gap-3 p-3 border rounded-md cursor-pointer", managerType === 'assistant' && "bg-primary/10 border-primary")}>
                            <RadioGroupItem value="assistant" id="manager-assistant" />
                            <Bot className="h-5 w-5" />
                            <span>Un Asistente</span>
                        </Label>
                    </RadioGroup>
                    {managerType === 'assistant' && (
                        <div className="pt-4 animate-fadeIn space-y-2">
                            <Label htmlFor="assistant-select">Selecciona el Asistente</Label>
                            <Select onValueChange={setManagerId} value={managerId}>
                                <SelectTrigger id="assistant-select" className="py-6">
                                    <SelectValue placeholder="Elige un asistente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {assistants.map(asst => (
                                        <SelectItem key={asst.id} value={asst.id}>{asst.name}</SelectItem>
                                    ))}
                                    {assistants.length === 0 && <SelectItem value="none" disabled>No tienes asistentes</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            );
            default: return null;
        }
    };
    
    const getManagerName = (type: 'user' | 'assistant', id: string) => {
        if (type === 'user') return state.userProfile.firstName || 'Yo';
        return assistants.find(a => a.id === id)?.name || 'Asistente';
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-screen h-screen max-w-full flex flex-col" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                 <DialogHeader className="p-4 border-b">
                    <DialogTitle>Crear Nueva Oferta de Crédito</DialogTitle>
                    <DialogDescription>Define los términos y asigna un gestor para esta oferta.</DialogDescription>
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

export const ProductsView = () => {
    const { state, dispatch } = useApp();
    const { toast } = useToast();
    const [isAddCatalogOpen, setIsAddCatalogOpen] = useState(false);
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const catalogs = state.userProfile.catalogs || [];

    const handleAddProduct = (catalogId: string) => {
        setEditingCatalogId(catalogId);
        setEditingProduct(null);
        setIsAddProductOpen(true);
    }
    
    const handleEditProduct = (catalogId: string, product: Product) => {
        setEditingCatalogId(catalogId);
        setEditingProduct(product);
        setIsAddProductOpen(true);
    }
    
     const handleDeleteProduct = (catalogId: string, productId: string) => {
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: {
            catalogs: catalogs.map(cat => {
                if (cat.id === catalogId) {
                    return { ...cat, products: cat.products.filter(p => p.id !== productId) };
                }
                return cat;
            })
        }});
        toast({ title: "Producto Eliminado" });
    };

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Productos</h1>
                        <p className="text-sm text-muted-foreground">Administra tus catálogos y productos.</p>
                    </div>
                </div>
            </header>
            <ScrollArea className="flex-grow p-4">
                 <div className="flex justify-end mb-4">
                    <Button onClick={() => setIsAddCatalogOpen(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4"/> Crear Catálogo
                    </Button>
                </div>
                {catalogs.length === 0 ? (
                     <Card className="text-center py-16">
                        <CardHeader>
                            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-semibold text-lg">Sin Catálogos</h3>
                            <CardDescription className="mt-2">Crea tu primer catálogo para empezar a añadir productos.</CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {catalogs.map(catalog => (
                            <Card key={catalog.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-base font-semibold">{catalog.name}</h3>
                                        <Button size="sm" variant="outline" onClick={() => handleAddProduct(catalog.id)}>
                                            <Plus className="mr-2 h-4 w-4"/> Añadir Producto
                                        </Button>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Promovido por: {catalog.promoterType === 'user' ? 'Ti mismo' : state.userProfile.assistants.find(a => a.id === catalog.promoterId)?.name || 'Asistente desconocido'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {catalog.products.length > 0 ? (
                                        <div className="divide-y">
                                            {catalog.products.map(product => (
                                                 <div key={product.id} className="flex items-center gap-4 py-3">
                                                    <Image src={product.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL} alt={product.name} width={48} height={48} className="rounded-md aspect-square object-cover" />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(catalog.id, product)}><Edit className="h-4 w-4"/></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProduct(catalog.id, product.id)}><Trash2 className="h-4 w-4"/></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-center text-muted-foreground py-4">Este catálogo no tiene productos.</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
             <CreateCatalogDialog isOpen={isAddCatalogOpen} onOpenChange={setIsAddCatalogOpen} />
             {editingCatalogId && <AddProductDialog isOpen={isAddProductOpen} onOpenChange={setIsAddProductOpen} catalogId={editingCatalogId} productToEdit={editingProduct} />}
        </>
    );
};

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

    
