// src/components/chat/MarketplaceDialog.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Search, Sparkles, Store, Briefcase, Landmark, ArrowLeft, ShoppingCart, Wallet, Send, MapPin, Truck, ShoppingBag, TruckIcon, Package, User, ChevronUp, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { AssistantConfig, CreditOffer, Delivery, Product } from '@/types';
import CreditApplicationDialog from './CreditApplicationDialog';
import { useApp } from '@/providers/AppProvider';
import { Separator } from '../ui/separator';

interface MarketplaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo data for credits, services can be phased out or integrated later
const demoItems = {
  services: [
    { id: 'serv_1', name: "Clases de Guitarra", price: 300, seller: "Sofía Luna", imageUrl: "https://i.imgur.com/cQ0Dvhv.png", imageHint: 'guitar lesson', location: 'Monterrey', description: "Clases personalizadas de guitarra acústica o eléctrica para todos los niveles. Sesiones de 1 hora." },
    { id: 'serv_2', name: "Mantenimiento de PC", price: 500, seller: "Luis Mendoza", imageUrl: "https://i.imgur.com/W2yvA5L.png", imageHint: 'pc maintenance', location: 'Ciudad de México', description: "Limpieza física y de software para tu computadora. Optimización de rendimiento y eliminación de virus." },
  ]
};

const demoCart: (Product & { quantity: number })[] = [
     { id: 'prod_2', name: "Diseño de Logotipo", price: 1200, seller: "Ana Gómez", imageUrl: "https://i.imgur.com/a2gGAlJ.png", quantity: 1, description: '', catalogId: '', ownerId: '', location: '' },
];


const OrdersDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { state } = useApp();
    const { deliveries, assistants, isAuthenticated } = state.userProfile;

    const activeDeliveries = useMemo(() => {
        const source = isAuthenticated ? (deliveries || []) : [];
        return source.filter(d => d.status !== 'delivered');
    }, [deliveries, isAuthenticated]);

    const getAssistantName = (assistantId: string | undefined) => {
        if (!assistantId) return 'Vendedor Desconocido';
        const assistant = assistants.find(a => a.id === assistantId);
        return assistant?.name || 'Vendedor Desconocido';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Mis Pedidos</DialogTitle>
                    <DialogDescription>Aquí puedes ver el estado de tus compras a domicilio.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow">
                    <div className="p-4 space-y-4">
                        {activeDeliveries.length > 0 ? (
                            activeDeliveries.map(order => (
                                <Card key={order.id}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Package className="h-10 w-10 text-primary" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{order.productName}</p>
                                            <p className="text-sm text-muted-foreground">{getAssistantName((order as any).assistantId)}</p>
                                            <p className="text-xs text-primary">{order.status === 'en_route' ? 'En camino' : 'Pendiente'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${order.productValue.toFixed(2)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <TruckIcon className="mx-auto h-12 w-12 mb-4" />
                                <p>No hay pedidos activos en este momento.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="p-4 border-t mt-auto">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CartDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { state, dispatch } = useApp();
    const { isAuthenticated, cart = [] } = state.userProfile;
    const items = isAuthenticated ? cart : demoCart;

    const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

    const handleQuantityChange = (productId: string, change: 1 | -1) => {
        if (!isAuthenticated) return;
        const existingItem = items.find(item => item.id === productId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + change;
            if (newQuantity > 0) {
                dispatch({ type: 'UPDATE_CART_ITEM_QUANTITY', payload: { productId, quantity: newQuantity } });
            } else {
                dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
            }
        }
    };
    
    const handleClearCart = () => {
        if (!isAuthenticated) return;
        dispatch({ type: 'CLEAR_CART' });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Carrito de Compras</DialogTitle>
                    <DialogDescription>Revisa tus productos antes de pagar.</DialogDescription>
                </DialogHeader>
                 <ScrollArea className="flex-grow p-4">
                    <div className="py-4 space-y-4">
                        {items.length > 0 ? (
                            items.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <Image src={item.imageUrl || ''} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, -1)} disabled={!isAuthenticated}>
                                                <Minus className="h-3 w-3"/>
                                            </Button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, 1)} disabled={!isAuthenticated}>
                                                <Plus className="h-3 w-3"/>
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="font-bold text-right">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                                <p>Tu carrito está vacío.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                 <div className="p-4 border-t mt-auto">
                    <Separator className="mb-4" />
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    {items.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleClearCart} disabled={!isAuthenticated}><Trash2 className="mr-2 h-4 w-4"/>Vaciar Carrito</Button>
                            <Button className="w-full flex-1">Proceder al Pago</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
    )
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
    const { state, dispatch } = useApp();
    const { isAuthenticated, cart = [], creditOffers = [] } = state.userProfile;
    const [searchTerm, setSearchTerm] = useState('');
    const [currentView, setCurrentView] = useState<View>('categories');
    const { toast } = useToast();
    const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
    const [selectedCreditAssistant, setSelectedCreditAssistant] = useState<AssistantConfig | null>(null);
    const [location, setLocation] = useState('Cargando...');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isOrdersOpen, setIsOrdersOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const activeDeliveriesCount = useMemo(() => {
        const source = isAuthenticated ? (state.userProfile.deliveries || []) : [];
        return source.filter(d => d.status !== 'delivered').length;
    }, [state.userProfile.deliveries, isAuthenticated]);
    
    const cartItemCount = useMemo(() => {
        const source = isAuthenticated ? cart : demoCart;
        return source.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart, isAuthenticated]);


    useEffect(() => {
        if (isOpen) {
            // Fetch location
            setTimeout(() => {
                setLocation("Ciudad de México");
            }, 500);

            // Fetch products
            if (currentView === 'products' || allProducts.length === 0) {
              setIsLoadingProducts(true);
              fetch('/api/products')
                .then(res => res.json())
                .then(data => {
                  if (data.products) {
                    setAllProducts(data.products);
                  }
                })
                .catch(err => {
                  console.error("Failed to fetch products", err);
                  toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
                })
                .finally(() => setIsLoadingProducts(false));
            }
            
            // Reset view
            setTimeout(() => {
                setCurrentView('categories');
                setSearchTerm('');
            }, 300);
        }
    }, [isOpen, currentView]);

    const filteredItems = useMemo(() => {
        if (currentView === 'categories') return [];
        let itemsToFilter: any[] = [];

        if (currentView === 'products') {
            itemsToFilter = allProducts || [];
        } else if (currentView === 'services') {
            itemsToFilter = demoItems.services || [];
        } else if (currentView === 'credits') {
            itemsToFilter = creditOffers || [];
        }
        
        return itemsToFilter.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, currentView, location, allProducts, creditOffers]);
    
    const handleRequestCredit = (credit: any) => {
        const assistant = state.userProfile.assistants.find(a => a.id === credit.assistantId);
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
    
    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated) {
            toast({ title: 'Inicia Sesión', description: 'Debes iniciar sesión para agregar productos al carrito.' });
            return;
        }
        dispatch({ type: 'ADD_TO_CART', payload: product });
        toast({
            title: "Producto Agregado",
            description: `"${product.name}" ha sido añadido a tu carrito.`,
        });
        setSelectedProduct(null); // Close detail view
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
            
             <div className="grid grid-cols-2 gap-4">
                 <div className="relative w-full">
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 items-center justify-center w-full" onClick={(e) => {e.stopPropagation(); setIsOrdersOpen(true);}}>
                        <Truck className="h-6 w-6" />
                        <span className="text-xs">Mis Pedidos</span>
                    </Button>
                    {activeDeliveriesCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                            {activeDeliveriesCount > 9 ? '9+' : activeDeliveriesCount}
                        </div>
                    )}
                </div>

                <div className="relative w-full">
                    <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 items-center justify-center w-full" onClick={(e) => {e.stopPropagation(); setIsCartOpen(true);}}>
                        <ShoppingCart className="h-6 w-6" />
                        <span className="text-xs">Carrito</span>
                    </Button>
                     {cartItemCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background">
                            {cartItemCount > 9 ? '9+' : cartItemCount}
                        </div>
                    )}
                </div>
            </div>
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
                            placeholder={`Buscar en ${title.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-10"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-grow my-4">
                    <div className="px-4 sm:px-6">
                        {isLoadingProducts ? (
                            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                        ) : filteredItems.length > 0 ? (
                            <motion.div
                                className={cn("grid gap-4", currentView === 'credits' ? 'grid-cols-1' : 'grid-cols-2')}
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
                                                      <p className="text-xs text-muted-foreground">{state.userProfile.assistants.find(a=> a.id === (item as CreditOffer).assistantId)?.name || 'Asistente desconocido'}</p>
                                                      <p className="font-bold text-lg text-primary">{item.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-extrabold text-foreground">${(item as CreditOffer).amount?.toLocaleString()}</p>
                                                        <p className="text-xs text-muted-foreground">Monto Máximo</p>
                                                    </div>
                                                </div>
                                                 <div className="flex justify-between text-xs pt-3 border-t">
                                                    <p>Tasa de interés: <span className="font-semibold">{(item as CreditOffer).interest}% mensual</span></p>
                                                    <p>Plazo: <span className="font-semibold">{(item as CreditOffer).term} { { weeks: 'sem.', fortnights: 'quinc.', months: 'meses' }[(item as CreditOffer).termUnit] }</span></p>
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
                                        <Card onClick={() => setSelectedProduct(item)} className="overflow-hidden cursor-pointer group glow-card transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                                            <div className="aspect-square relative w-full">
                                                <Image src={item.imageUrl || ''} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={(item as any).imageHint} />
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
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                                <MapPin className="h-10 w-10 mb-2"/>
                                <p className="font-semibold">No hay resultados.</p>
                                <p className="text-sm">Intenta con otra búsqueda o revisa más tarde.</p>
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

                    <div className="px-4 sm:px-6 py-2 border-b border-t flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>Mostrando resultados cerca de: <span className="font-semibold text-foreground">{location}</span></span>
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0" disabled>Cambiar</Button>
                    </div>
                    
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
            
            <AnimatePresence>
            {selectedProduct && (
                <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                    <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] w-screen h-screen max-w-full flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg" onInteractOutside={(e) => e.preventDefault()}>
                         <DialogTitle className="sr-only">{selectedProduct.name}</DialogTitle>
                         <div className="absolute inset-0 z-0">
                            <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} layout="fill" objectFit="cover" className="blur-lg scale-110 opacity-40" />
                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                        </div>
                        <ScrollArea className="relative z-10 flex-grow pb-24">
                             <div className="p-4 flex flex-col gap-4">
                                <motion.div
                                    className="w-full aspect-square relative rounded-xl overflow-hidden shadow-2xl"
                                >
                                    <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} layout="fill" objectFit="cover" />
                                </motion.div>
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.4}}
                                    className="p-4 bg-background/70 backdrop-blur-md rounded-xl shadow-lg border border-white/10"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Vendido por {selectedProduct.seller}</p>
                                            <h2 className="text-2xl font-bold mt-1">{selectedProduct.name}</h2>
                                        </div>
                                        <p className="text-3xl font-extrabold text-primary">${selectedProduct.price.toFixed(2)}</p>
                                    </div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="p-4 bg-background/70 backdrop-blur-md rounded-xl shadow-lg border border-white/10 space-y-3">
                                     <h3 className="font-semibold text-sm">Entrega</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                                            <Store className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-semibold">Recoger en local</p>
                                                <p className="text-xs text-muted-foreground">Visita la tienda y recoge tu producto.</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                                            <Truck className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs font-semibold">Enviar a domicilio</p>
                                                <p className="text-xs text-muted-foreground">Recibe tu producto en casa.</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-4 bg-background/70 backdrop-blur-md rounded-xl shadow-lg border border-white/10 space-y-2">
                                    <h3 className="font-semibold text-sm">Descripción</h3>
                                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                                </motion.div>
                            </div>
                        </ScrollArea>
                        <motion.div
                             className="sticky bottom-0 z-20 p-4 border-t bg-background/80 backdrop-blur-sm"
                         >
                             <div className="grid grid-cols-2 gap-2">
                                <Button variant="secondary" size="lg" onClick={() => handleAddToCart(selectedProduct)}>Agregar</Button>
                                <Button size="lg" className="bg-brand-gradient text-primary-foreground">Comprar</Button>
                            </div>
                         </motion.div>
                        <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-20 bg-background/50 rounded-full" onClick={() => setSelectedProduct(null)}>
                           <ArrowLeft />
                        </Button>
                    </DialogContent>
                </Dialog>
            )}
            </AnimatePresence>
            <OrdersDialog isOpen={isOrdersOpen} onOpenChange={setIsOrdersOpen} />
            <CartDialog isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
        </>
    );
};

export default MarketplaceDialog;
