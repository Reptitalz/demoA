// src/components/chat/admin/AdminViews.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign, Crown, Database, BookText, Percent, Calendar, Edit, ArrowRight, ArrowLeft, Truck, Store, Wallet, Send, Building, CheckCircle } from 'lucide-react';
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
import { AssistantConfig } from '@/types';
import BusinessInfoDialog from '@/components/dashboard/BusinessInfoDialog';
import CreateAssistantDialog from './CreateAssistantDialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

const demoPayments = [
  {
    id: 'pay-1',
    product: 'Pastel de Chocolate Grande',
    assistantName: 'Asistente de Ventas',
    userName: 'Usuario B',
    chatPath: 'usuario-b-123',
    amount: 350.00,
    receiptUrl: 'https://i.imgur.com/L4i1i8K.png',
    receivedAt: new Date(),
    status: 'pending',
  },
  {
    id: 'pay-2',
    product: 'Servicio de Mantenimiento',
    assistantName: 'Asistente Taller',
    userName: 'Cliente Frecuente',
    chatPath: 'cliente-f-456',
    amount: 850.50,
    receiptUrl: 'https://i.imgur.com/L4i1i8K.png',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'pending',
  },
   {
    id: 'pay-3',
    product: 'Adelanto de Nómina',
    assistantName: 'Créditos Rápidos',
    userName: 'Empleado X',
    chatPath: 'empleado-x-789',
    amount: 2500.00,
    receiptUrl: 'https://i.imgur.com/JzJzJzJ.jpeg',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    status: 'completed',
  },
];

const demoProducts = [
    { id: 'prod-1', name: 'Pastel de Chocolate', price: 350.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
    { id: 'prod-2', name: 'Galletas de Chispas', price: 150.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
    { id: 'prod-3', name: 'Cupcakes de Vainilla (6)', price: 200.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
];

const demoCatalogs = [
    { id: 'cat-1', name: 'Catálogo de Repostería', promoter: 'Asistente de Ventas', promoterType: 'bot' },
    { id: 'cat-2', name: 'Servicios de Taller', promoter: 'Tú Mismo', promoterType: 'user' },
    { id: 'cat-3', name: 'Catálogo General', promoter: 'Asistente de Soporte', promoterType: 'bot' },
];


const ReceiptDialog = ({ payment, isOpen, onOpenChange }: { payment: any | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!payment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 flex flex-col bg-background">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Recibo de Pago</DialogTitle>
                    <DialogDescription>
                        Recibido el {format(payment.receivedAt, "PPPp", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-auto p-4">
                    <Image
                        src={payment.receiptUrl}
                        alt="Recibo de pago"
                        width={800}
                        height={1200}
                        className="rounded-md border w-full h-auto"
                    />
                </div>
                <DialogFooter className="p-4 bg-background border-t flex justify-end gap-2">
                    <Button variant="destructive" onClick={() => onOpenChange(false)}><XCircle className="mr-2"/> Rechazar</Button>
                    <Button variant="default" onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700"><Check className="mr-2"/> Autorizar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const BankView = () => {
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [filter, setFilter] = useState<'pending' | 'completed'>('pending');

    const filteredPayments = useMemo(() => {
        return demoPayments.filter(p => p.status === filter);
    }, [filter]);

    const totalIncome = useMemo(() => {
        return demoPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    }, []);
    
    const pendingCount = useMemo(() => {
        return demoPayments.filter(p => p.status === 'pending').length;
    }, []);

    const handleViewReceipt = (payment: any) => {
        setSelectedPayment(payment);
        setIsReceiptOpen(true);
    };

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Banknote className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Banco</h1>
                    </div>
                </div>
            </header>
            <div className="p-4">
                 <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground font-normal text-sm">Ingreso Total (Completado)</p>
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
                        Completados
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-grow px-2">
                <div className="p-2 space-y-3">
                    {filteredPayments.length > 0 ? filteredPayments.map(payment => (
                         <Card key={payment.id} className="glow-card">
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-sm">{payment.product}</p>
                                        <p className="text-xs text-muted-foreground">Asistente: {payment.assistantName}</p>
                                        <p className="text-xs text-muted-foreground">De: {payment.userName} ({payment.chatPath})</p>
                                    </div>
                                    <p className="font-bold text-green-500">${payment.amount.toFixed(2)}</p>
                                </div>
                                {payment.status === 'pending' && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t">
                                        <Button size="sm" className="flex-1" onClick={() => handleViewReceipt(payment)}>
                                            <Eye className="mr-2"/>Ver Recibo
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <FileText className="mr-2"/>Ver Detalles
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No hay pagos {filter === 'pending' ? 'pendientes' : 'completados'}.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
             <ReceiptDialog 
                payment={selectedPayment}
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
            />
        </>
    );
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const promoterOptions = useMemo(() => [
    { id: 'owner', name: 'Tú Mismo', imageUrl: state.userProfile.imageUrl },
    ...assistants
  ], [assistants, state.userProfile.imageUrl]);
  
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
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Catálogo</DialogTitle>
          <DialogDescription>
            Define el nombre y el promotor de tu nuevo catálogo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-1 overflow-y-hidden flex flex-col">
          <div className="px-1 space-y-2">
            <Label htmlFor="catalog-name">Nombre del Catálogo</Label>
            <Input id="catalog-name" placeholder="Ej: Menú de Fin de Semana" value={catalogName} onChange={e => setCatalogName(e.target.value)} />
          </div>
          <div className="px-1 space-y-2 flex-1 flex flex-col overflow-y-hidden">
            <Label>¿Quién promocionará este catálogo?</Label>
            <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2">
                {promoterOptions.map((promoter, index) => {
                    const isSelected = selectedPromoter === promoter.id;
                    return (
                        <div key={promoter.id} className="w-full sm:w-1/2 flex-shrink-0 snap-center p-2" onClick={() => setSelectedPromoter(promoter.id)}>
                             <Card 
                                className={cn("transition-all border-2 overflow-hidden shadow-lg h-full cursor-pointer", isSelected ? "border-primary shadow-primary/20" : "hover:border-primary/50", "glow-card")}
                            >
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 relative">
                                    {isSelected && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary"/>}
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={promoter.imageUrl} />
                                        <AvatarFallback>
                                            {promoter.id === 'owner' ? <User /> : <Bot />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold text-sm truncate">{promoter.name}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )
                })}
            </div>
             <div className="flex justify-center mt-2 space-x-2">
                {promoterOptions.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (scrollRef.current) {
                                const cardWidth = scrollRef.current.clientWidth / (window.innerWidth < 640 ? 1 : 2);
                                scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                            }
                        }}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            activeIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                        )}
                        aria-label={`Ir al promotor ${index + 1}`}
                    />
                ))}
            </div>
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

    const handleSelectCatalog = (catalogId: string) => {
        setSelectedCatalogId(catalogId);
    };

    const handleBackToList = () => {
        setSelectedCatalogId(null);
        setSearchTerm('');
    };

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
                        {demoCatalogs.map(catalog => (
                             <Card key={catalog.id} className="glow-card cursor-pointer" onClick={() => handleSelectCatalog(catalog.id)}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-full">
                                        {catalog.promoterType === 'bot' ? <Bot className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{catalog.name}</p>
                                        <p className="text-xs text-muted-foreground">Promocionado por: {catalog.promoter}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ))}
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

    const filteredProducts = demoProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCatalog = demoCatalogs.find(c => c.id === selectedCatalogId);

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm space-y-2">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBackToList}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex-grow">
                         <h1 className="text-xl font-bold">{selectedCatalog?.name || 'Catálogo de Productos'}</h1>
                         <p className="text-xs text-muted-foreground">Promocionado por: {selectedCatalog?.promoter}</p>
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
                        <Button size="sm" className="h-9 bg-brand-gradient text-primary-foreground hover:opacity-90" onClick={() => setIsCreateCatalogDialogOpen(true)}>
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
                                <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" />
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
                            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none">
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
    </>
  );
}

export const CreditView = ({ viewName }: { viewName: string }) => {
    const activeLoans = [
        { id: 1, chatPath: 'cliente-a-xyz', amount: 5000.00, status: 'Al Corriente' },
        { id: 2, chatPath: 'usuario-b-123', amount: 10000.00, status: 'Atrasado' },
        { id: 3, chatPath: 'nuevo-c-456', amount: 2500.00, status: 'Pagado' },
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
             <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Gestión de Crédito</h1>
                    </div>
                </div>
            </header>
             <div className="p-4 space-y-4">
                 <Card className="shadow-lg glow-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>Definir Oferta de Crédito</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                        </CardTitle>
                        <CardDescription>Establece las condiciones para los créditos que tus asistentes pueden ofrecer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <Label>Monto Máximo</Label>
                                <div className="font-semibold flex items-center gap-1.5"><DollarSign size={14}/> 15,000.00</div>
                            </div>
                             <div className="space-y-1">
                                <Label>Tasa de Interés</Label>
                                <div className="font-semibold flex items-center gap-1.5"><Percent size={14}/> 5% mensual</div>
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label>Plazos Disponibles</Label>
                            <div className="font-semibold flex items-center gap-1.5"><Calendar size={14}/> 3, 6 y 12 meses</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <ScrollArea className="flex-grow px-2">
                 <div className="p-2 space-y-3">
                    <h3 className="px-2 text-sm font-semibold text-muted-foreground">Créditos Activos</h3>
                     {activeLoans.map(loan => (
                         <Card key={loan.id} className="glow-card">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{loan.chatPath.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-sm truncate">{loan.chatPath}</p>
                                        <p className={cn("text-xs", loan.status === 'Atrasado' ? 'text-destructive' : 'text-green-600')}>{loan.status}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">${loan.amount.toFixed(2)}</p>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">Ver detalles</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};


export const OtherView = ({ viewName }: { viewName: string }) => (
    <div className="flex flex-col h-full bg-transparent">
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
             <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
             <p className="text-sm text-muted-foreground">Vista de {viewName}</p>
        </header>
        <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground">Contenido para {viewName} irá aquí.</p>
        </div>
    </div>
);
