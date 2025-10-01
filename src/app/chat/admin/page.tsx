// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Banknote, Bot, Package, DollarSign, ArrowLeft, Star, MessageCircle, ShoppingCart, Landmark, CreditCard, XCircle, ShieldCheck, Crown, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, OtherView as CreditView } from '@/components/chat/admin/AdminViews';
import { Button } from '@/components/ui/button';
import PlansDialog from '@/components/dashboard/PlansDialog';
import { useApp } from '@/providers/AppProvider';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { List, ListItem } from '@/components/ui/list';

type AdminView = 'home' | 'bank' | 'bots' | 'products' | 'credit';

const menuItems = [
    { view: 'bank' as AdminView, title: 'Autorizaciones', description: "Revisa y autoriza pagos y documentos.", icon: CheckSquare, area: 'a' },
    { view: 'bots' as AdminView, title: 'Bots', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
];

const PlanCarousel = ({ onUpgrade }: { onUpgrade: () => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const plans = [
        {
            name: "Plan Gratuito",
            icon: XCircle,
            iconClass: "text-destructive",
            badge: <Badge variant="destructive">Limitaciones Activas</Badge>,
            features: [
                { icon: MessageCircle, text: 'Máximo 100 mensajes por día para todos los bots.' },
                { icon: Landmark, text: 'Autorización en banco limitada a 100 transacciones diarias.' },
                { icon: ShoppingCart, text: 'Catálogo de solo 5 artículos para la venta.' },
                { icon: CreditCard, text: 'Solo se puede ofrecer una línea de crédito.' },
            ],
            button: <Button size="sm" className="w-full text-xs mt-2" disabled>Actualmente Activo</Button>
        },
        {
            name: "Plan Mensual: Ilimitado",
            icon: ShieldCheck,
            iconClass: "text-green-500",
            badge: <Badge variant="default" className="bg-green-500 hover:bg-green-600">Recomendado</Badge>,
            features: [
                { icon: MessageCircle, text: 'Mensajes ilimitados para todos tus asistentes.' },
                { icon: Landmark, text: 'Transacciones bancarias sin restricciones.' },
                { icon: ShoppingCart, text: 'Catálogo de productos ilimitado.' },
                { icon: CreditCard, text: 'Múltiples líneas de crédito para tus clientes.' },
            ],
            button: <Button onClick={onUpgrade} size="sm" className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs mt-2">
                        <Crown className="mr-2 h-3 w-3"/>
                        Obtener Plan por $179/mes
                    </Button>
        }
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
            scroller.addEventListener('scroll', handleScroll);
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="w-full">
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            >
                {plans.map((plan, index) => (
                     <div key={index} className="w-full flex-shrink-0 snap-center p-2">
                        <Card className="w-full text-left glow-card bg-card border shadow-lg overflow-hidden">
                             <CardHeader className="p-4 bg-muted/50 border-b">
                                <div className="flex items-center justify-between">
                                   <CardTitle className="text-base flex items-center gap-2">
                                      <plan.icon className={cn("h-5 w-5", plan.iconClass)} />
                                      {plan.name}
                                   </CardTitle>
                                   {plan.badge}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <List>
                                    {plan.features.map((item, itemIndex) => (
                                        <ListItem key={itemIndex} className="text-xs">
                                            <item.icon className="h-3 w-3 mr-2 shrink-0" />
                                            {item.text}
                                        </ListItem>
                                    ))}
                                </List>
                                {plan.button}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
             <div className="flex justify-center mt-2 space-x-2">
                {plans.map((_, index) => (
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
                        aria-label={`Ir al plan ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


export default function AdminHomePage() {
  const { state } = useApp();
  const router = useRouter();
  const { isAuthenticated } = state.userProfile;
  const [activeView, setActiveView] = useState<AdminView>('home');
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  
  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
        router.push('/login');
    } else {
        setIsPlansOpen(true);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'bank':
        return <BankView />;
      case 'bots':
        return <AssistantsList />;
      case 'products':
        return <ProductsView />;
      case 'credit':
        return <CreditView />;
      case 'home':
      default:
        return (
            <>
                <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                    <h1 className="text-2xl font-bold">Panel de Miembro</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus operaciones y asistentes.</p>
                </header>

                <div className="p-4 space-y-4">
                    <div className="p-4 grid gap-3 grid-cols-2">
                        {menuItems.map((item, index) => (
                        <motion.div
                            key={item.view}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="aspect-square"
                        >
                            <Card
                                onClick={() => setActiveView(item.view)}
                                className={cn(
                                    "h-full w-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
                                    "bg-card/50 hover:bg-card/90 hover:shadow-primary/10 hover:border-primary/20 border"
                                )}
                            >
                                <CardHeader className="p-2">
                                    <div className="p-2 bg-primary/10 rounded-full mx-auto">
                                        <item.icon className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-2 pt-0">
                                    <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{item.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>
                        ))}
                    </div>
                     <div className="px-2">
                        <PlanCarousel onUpgrade={handleUpgradeClick} />
                    </div>
                </div>
            </>
        );
    }
  };

  return (
    <>
    <div className="flex flex-col h-full bg-transparent">
      {activeView !== 'home' && (
         <div className="p-2 border-b bg-card/80 backdrop-blur-sm">
            <button onClick={() => setActiveView('home')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Volver al panel
            </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </div>
    <PlansDialog isOpen={isPlansOpen} onOpenChange={