// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot, Plus, MessageSquarePlus, Banknote, Eye, Check, FileText, Package, Upload, DollarSign } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import CreateAssistantDialog from '@/components/chat/CreateAssistantDialog';
import type { AdminView } from '../ChatLayout';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Label } from '@/components/ui/label';

// Demo data for admin chat trays
const demoAdminChats = [
    {
        id: 'user-1',
        name: 'Cliente A - Asistente de Ventas',
        status: 'en línea',
        lastMessage: 'Sí, me gustaría confirmar el pedido.',
        timestamp: 'Ahora',
        avatarUrl: 'https://i.imgur.com/8p8Yf9u.png',
        memory: 123456
    },
    {
        id: 'user-2',
        name: 'Usuario B - Asistente de Soporte',
        status: 'en línea',
        lastMessage: 'Gracias por la ayuda, se ha solucionado.',
        timestamp: 'Hace 5m',
        avatarUrl: 'https://i.imgur.com/8p8Yf9u.png',
        memory: 78910
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
  },
];

const demoProducts = [
    { id: 'prod-1', name: 'Pastel de Chocolate', price: 350.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
    { id: 'prod-2', name: 'Galletas de Chispas', price: 150.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
    { id: 'prod-3', name: 'Cupcakes de Vainilla (6)', price: 200.00, imageUrl: 'https://i.imgur.com/JzJzJzJ.jpeg' },
];


const ReceiptDialog = ({ payment, isOpen, onOpenChange }: { payment: any | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!payment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Recibo de Pago</DialogTitle>
                    <DialogDescription>
                        Recibido el {format(payment.receivedAt, "PPPp", { locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 max-h-[60vh] overflow-y-auto">
                    <Image
                        src={payment.receiptUrl}
                        alt="Recibo de pago"
                        width={400}
                        height={600}
                        className="rounded-md border w-full h-auto"
                    />
                </div>
                <DialogFooter className="p-6 bg-muted/50 flex justify-end gap-2">
                    <Button variant="destructive" onClick={() => onOpenChange(false)}><XCircle className="mr-2"/> Rechazar</Button>
                    <Button variant="default" onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700"><Check className="mr-2"/> Autorizar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const BankView = () => {
    const totalIncome = demoPayments.reduce((sum, p) => sum + p.amount, 0);
    const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

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
                        <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
                        <p className="text-sm text-muted-foreground">Gestión de Banco</p>
                    </div>
                </div>
            </header>
            <div className="p-4">
                 <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                    <CardContent className="p-6">
                        <p className="text-muted-foreground font-normal text-sm">Ingreso Total</p>
                        <p className="text-4xl font-extrabold text-foreground mt-1">
                            ${totalIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>
            </div>
            <ScrollArea className="flex-grow px-2">
                <div className="p-2 space-y-3">
                    <h3 className="px-2 text-sm font-semibold text-muted-foreground">Pagos Pendientes</h3>
                    {demoPayments.map(payment => (
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
                                <div className="flex gap-2 mt-3 pt-3 border-t">
                                    <Button size="sm" className="flex-1" onClick={() => handleViewReceipt(payment)}>
                                        <Eye className="mr-2"/>Ver Recibo
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1">
                                        <FileText className="mr-2"/>Ver Detalles
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del producto para añadirlo a tu catálogo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-name">Nombre del Producto</Label>
                        <Input id="product-name" placeholder="Ej: Pastel de Tres Leches" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="product-price">Precio</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="product-price" type="number" placeholder="Ej: 250.00" className="pl-9" />
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
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onOpenChange(false)}>Guardar Producto</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const ProductsView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

    const filteredProducts = demoProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
                        <p className="text-sm text-muted-foreground">Catálogo de Productos</p>
                    </div>
                </div>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        className="pl-10 bg-background/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
                className="absolute bottom-28 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
                size="icon"
                title="Añadir Producto"
            >
                <Plus className="h-6 w-6" />
            </Button>
            <AddProductDialog isOpen={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen} />
        </>
    );
};


const AssistantsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSwipe, setActiveSwipe] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const router = useRouter();
  const dragOccurred = useRef(false);
  const [isCreateAssistantDialogOpen, setIsCreateAssistantDialogOpen] = useState(false);

  const filteredChats = demoAdminChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateAssistant = () => {
    setIsCreateAssistantDialogOpen(true);
  };
  
  return (
    <>
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
                    <p className="text-sm text-muted-foreground">Supervisión de Asistentes</p>
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
                            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-gray-500/20 hover:bg-gray-500/30 rounded-none">
                                <Trash2 size={20}/>
                                <span className="text-xs mt-1">Borrar</span>
                            </Button>
                             <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none">
                                <XCircle size={20}/>
                                <span className="text-xs mt-1">Limpiar</span>
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
                            <Button variant="ghost" className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5">
                                <HardDrive size={20}/>
                                <span className="text-xs">Memoria</span>
                                <span className="text-[10px] font-bold">{formatBytes(chat.memory)}</span>
                            </Button>
                            <Button variant="ghost" className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-green-500/20 hover:bg-green-500/30 rounded-none gap-0.5">
                                <Bot size={20}/>
                                <span className="text-xs">Activar IA</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -160, right: 192 }}
                    onDragStart={() => dragOccurred.current = false}
                    onDrag={() => dragOccurred.current = true}
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
                        if (!dragOccurred.current) {
                           // This is a click, navigate to chat
                           // router.push(`/chat/admin/${chat.id}`); // Example path
                        }
                         // Reset drag flag after click check
                        setTimeout(() => { dragOccurred.current = false; }, 50);
                    }}
                    animate={{ 
                        x: isLeftSwiped ? -160 : isRightSwiped ? 192 : 0 
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
                                    <AvatarImage src={chat.avatarUrl} alt={chat.name} />
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
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">{chat.status}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">{chat.timestamp}</p>
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
            className="absolute bottom-28 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
            size="icon"
            title="Crear nuevo asistente"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
       <CreateAssistantDialog isOpen={isCreateAssistantDialogOpen} onOpenChange={setIsCreateAssistantDialogOpen} />
    </>
  );
}

const OtherView = ({ viewName }: { viewName: string }) => (
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


const AdminChatInterface = ({ activeView }: { activeView: AdminView }) => {
  return (
    <div className="flex flex-col h-full bg-transparent relative">
        {activeView === 'bank' && <BankView />}
        {activeView === 'assistants' && <AssistantsList />}
        {activeView === 'products' && <ProductsView />}
        {activeView === 'credit' && <OtherView viewName="Créditos" />}
    </div>
  );
};

export default function AdminPage({ activeView = 'bank' }: { activeView?: AdminView }) {
    return <AdminChatInterface activeView={activeView} />;
}
