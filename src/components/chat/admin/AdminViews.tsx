
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateCreditOfferDialog from './CreateCreditOfferDialog';


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
        if (!receiptUrl) return <FileText className="h-5 w-5 text-muted-foreground"/>;
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
                        <p className="text-sm text-muted-foreground">Revisa lo que el asistente recibe en imágenes aquí</p>
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
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-muted rounded-full">
                                            {getFileIcon(payment.receiptUrl)}
                                        </div>
                                        <div className="space-y-1 flex-1 overflow-hidden">
                                            <p className="font-semibold text-sm truncate">{payment.product || 'Sin producto'} de {payment.userName}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                a {payment.assistantName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
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

export const AssistantsList = () => {
    const { state, dispatch } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const [isConversationsDialogOpen, setIsConversationsDialogOpen] = useState(false);
    const [selectedAssistant, setSelectedAssistant] = useState<AssistantConfig | null>(null);
    const [assistantToDelete, setAssistantToDelete] = useState<AssistantConfig | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleOpenConversations = (assistant: AssistantConfig) => {
        if (assistant.chatPath) {
            router.push(`/chat/conversation/${assistant.chatPath}`);
        } else {
            toast({
                title: "No se puede abrir el chat",
                description: "Este asistente no tiene una ruta de chat configurada.",
                variant: "destructive"
            });
        }
    };

    const handleConfigureAssistant = (assistant: AssistantConfig) => {
        dispatch({ type: 'SET_EDITING_ASSISTANT_ID', payload: assistant.id });
        dispatch({ type: 'SET_IS_RECONFIGURING', payload: true });
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: assistant.name });
        dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: assistant.prompt || '' });
        // You might need to populate other wizard states here if reconfiguring from scratch
        router.push('/app');
    };

    const handleDeleteAssistant = (assistant: AssistantConfig) => {
        setAssistantToDelete(assistant);
    };

    const confirmDelete = () => {
        if (assistantToDelete) {
            dispatch({ type: 'REMOVE_ASSISTANT', payload: assistantToDelete.id });
            toast({ title: "Asistente Eliminado", description: `El asistente "${assistantToDelete.name}" ha sido eliminado.` });
            setAssistantToDelete(null);
        }
    };

    const desktopAssistants = useMemo(() => {
        return state.userProfile.assistants.filter(a => a.type === 'desktop');
    }, [state.userProfile.assistants]);

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Monitor de Bots</h1>
                        <p className="text-sm text-muted-foreground">Supervisa las conversaciones de tus asistentes de escritorio.</p>
                    </div>
                </div>
            </header>

            <div className="p-4 text-center">
                 <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Crear Bot inteligente
                </Button>
            </div>

            <ScrollArea className="flex-grow p-4 pt-0">
                <div className="space-y-4">
                    {desktopAssistants.map(assistant => (
                        <Card key={assistant.id}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={assistant.imageUrl} />
                                        <AvatarFallback>{assistant.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{assistant.name}</p>
                                        <Badge variant={assistant.isActive ? 'default' : 'secondary'}>
                                            {assistant.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenConversations(assistant)}>
                                        <MessageSquarePlus className="mr-2 h-4 w-4"/> Ver Chats
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleConfigureAssistant(assistant)}>
                                        <Settings className="h-4 w-4"/>
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAssistant(assistant)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {desktopAssistants.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground py-8">No tienes asistentes de escritorio.</p>
                    )}
                </div>
            </ScrollArea>
            {selectedAssistant && (
                <ConversationsDialog
                    isOpen={isConversationsDialogOpen}
                    onOpenChange={setIsConversationsDialogOpen}
                    assistants={[selectedAssistant]}
                />
            )}
            <CreateAssistantDialog 
                isOpen={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
            <AlertDialog open={!!assistantToDelete} onOpenChange={() => setAssistantToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al asistente "{assistantToDelete?.name}". No se puede deshacer.
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

export const CreditView = () => {
    const { state, dispatch } = useApp();
    const { userProfile, loadingStatus } = state;
    const { toast } = useToast();
    const [activeSubView, setActiveSubView] = useState<'requests' | 'offers'>('requests');
    const [filter, setFilter] = useState<'pending' | 'active' | 'other'>('active');
    const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<CreditLine | null>(null);

    const creditLines = userProfile.creditLines || [];
    const creditOffers = userProfile.creditOffers || [];

    const filteredLines = useMemo(() => {
        if (filter === 'active') {
            return creditLines.filter(cl => cl.status === 'Al Corriente' || cl.status === 'Atrasado');
        }
        if (filter === 'pending') {
            return creditLines.filter(cl => cl.status === 'pending');
        }
        return creditLines.filter(cl => !['Al Corriente', 'Atrasado', 'pending'].includes(cl.status));
    }, [filter, creditLines]);

    const handleAction = async (creditLineId: string, status: 'approved' | 'rejected', amount?: number) => {
        try {
            const response = await fetch('/api/credit', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: userProfile._id?.toString(),
                    creditLineId,
                    status,
                    amount,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el estado del crédito');
            }

            const updatedLines = creditLines.map(cl => {
                if (cl.id === creditLineId) {
                    return { ...cl, status: status === 'approved' ? 'Al Corriente' : 'rejected', amount: status === 'approved' ? amount || cl.amount : cl.amount, updatedAt: new Date().toISOString() };
                }
                return cl;
            });

            dispatch({ type: 'UPDATE_USER_PROFILE', payload: { creditLines: updatedLines } });
            toast({ title: 'Éxito', description: `La solicitud ha sido ${status === 'approved' ? 'aprobada' : 'rechazada'}.` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };
    
    const totalApprovedAmount = useMemo(() => {
        return creditLines.filter(cl => cl.status !== 'rejected' && cl.status !== 'pending').reduce((sum, cl) => sum + cl.amount, 0);
    }, [creditLines]);

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Créditos</h1>
                        <p className="text-sm text-muted-foreground">Administra tus ofertas y solicitudes de crédito.</p>
                    </div>
                </div>
            </header>

            <Tabs value={activeSubView} onValueChange={(value) => setActiveSubView(value as any)} className="flex-grow flex flex-col">
                <div className="px-4 mt-4">
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1 max-w-xs mx-auto">
                      <TabsTrigger value="requests" className="flex flex-col gap-1 p-2 h-auto">
                          <FileText className="h-5 w-5"/>
                          <span className="text-xs">Solicitudes</span>
                      </TabsTrigger>
                      <TabsTrigger value="offers" className="flex flex-col gap-1 p-2 h-auto">
                          <LandmarkIcon className="h-5 w-5"/>
                          <span className="text-xs">Mis Ofertas</span>
                      </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="requests" className="flex-grow flex flex-col">
                    <div className="p-4">
                        <Card className="shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                            <CardContent className="p-6 relative z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm opacity-80">Crédito Activo Total</p>
                                        <p className="text-3xl font-extrabold mt-1">${totalApprovedAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="bg-white/10 hover:bg-white/20" onClick={() => setIsHistoryOpen(true)}>
                                        <History />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="px-4 pb-4">
                        <div className="flex gap-2">
                            <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>Activos</Button>
                            <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>Pendientes ({creditLines.filter(cl => cl.status === 'pending').length})</Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-grow p-4 pt-0">
                        <div className="space-y-3">
                            {filteredLines.map(line => (
                                <Card key={line.id} className={line.status === 'Atrasado' ? 'border-destructive' : ''}>
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{line.applicantIdentifier}</p>
                                                <Badge variant={line.status === 'Atrasado' ? 'destructive' : 'secondary'} className="text-xs">{line.status}</Badge>
                                            </div>
                                            <div className="text-right">
                                                {line.amount > 0 && <p className="font-bold text-lg">${line.amount.toFixed(2)}</p>}
                                            </div>
                                        </div>
                                        {line.status === 'pending' ? (
                                            <div className="flex gap-2 mt-2 pt-2 border-t">
                                                <Button size="sm" variant="destructive" onClick={() => handleAction(line.id, 'rejected')}>Rechazar</Button>
                                                <Button size="sm" onClick={() => handleAction(line.id, 'approved', 5000)}>Aprobar (Ej: $5000)</Button>
                                            </div>
                                        ) : (
                                            <Button size="sm" variant="link" className="p-0 h-auto text-xs mt-1" onClick={() => setSelectedCredit(line)}>Ver Historial</Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                            {filteredLines.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay solicitudes en esta categoría.</p>}
                        </div>
                    </ScrollArea>
                </TabsContent>
                
                <TabsContent value="offers" className="flex-grow flex flex-col p-4">
                    <div className="flex justify-end mb-4">
                         <Button size="sm" onClick={() => setIsCreateOfferOpen(true)}><Plus className="mr-2 h-4 w-4"/> Crear Oferta de Crédito</Button>
                    </div>
                    <ScrollArea className="flex-grow">
                        <div className="space-y-3">
                             {creditOffers.length > 0 ? creditOffers.map(offer => (
                                <Card key={offer.id}>
                                    <CardContent className="p-3">
                                        <p className="font-semibold">{offer.name}</p>
                                        <p className="text-sm text-muted-foreground">${offer.amount.toLocaleString()} @ {offer.interest}%</p>
                                    </CardContent>
                                </Card>
                            )) : (
                                <p className="text-sm text-center text-muted-foreground py-8">No has creado ninguna oferta de crédito.</p>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
             <CreditHistoryDialog credit={selectedCredit} isOpen={!!selectedCredit} onOpenChange={() => setSelectedCredit(null)} />
             <CreateCreditOfferDialog isOpen={isCreateOfferOpen} onOpenChange={setIsCreateOfferOpen} />
        </>
    );
};


export const DeliveryView = () => (
    <div className="flex flex-col h-full bg-transparent">
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
             <h1 className="text-xl font-bold">Gestión de Repartidores</h1>
             <p className="text-sm text-muted-foreground">Esta sección estará disponible próximamente.</p>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Próximamente...</p>
        </div>
    </div>
);


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

    

    




    

    

    