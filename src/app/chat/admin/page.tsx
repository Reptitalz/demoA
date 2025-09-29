// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Banknote, Bot, Package, DollarSign, ArrowLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, OtherView as CreditView } from '@/components/chat/admin/AdminViews';
import { Button } from '@/components/ui/button';
import PlansDialog from '@/components/dashboard/PlansDialog';
import { useApp } from '@/providers/AppProvider';
import { useRouter } from 'next/navigation';

type AdminView = 'home' | 'bank' | 'assistants' | 'products' | 'credit';

const menuItems = [
    { view: 'bank' as AdminView, title: 'Banco', description: "Revisa y autoriza los pagos recibidos.", icon: Banknote, area: 'a' },
    { view: 'bots' as AdminView, title: 'Bots', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
];

const PlanCard = ({ onClick }: { onClick: () => void }) => {
    return (
        <div className="w-full flex-shrink-0 snap-center p-2">
            <Card className="p-4 text-left glow-card h-full flex flex-col bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between">
                       <CardTitle className="text-base flex items-center gap-2">
                          <Star className="text-yellow-400" />
                          Plan Mensual
                       </CardTitle>
                       <span className="text-lg font-bold text-foreground">$179</span>
                    </div>
                    <CardDescription className="text-xs pt-1">Mensajes ilimitados para un asistente.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow mt-3">
                    <Button onClick={onClick} size="sm" className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs">
                        Comprar Plan
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

const AdminHomePage = () => {
  const { state } = useApp();
  const router = useRouter();
  const { isAuthenticated } = state.userProfile;
  const [activeView, setActiveView] = useState<AdminView>('home');
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const plansScrollRef = useRef<HTMLDivElement>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  const handlePlansClick = () => {
    if (!isAuthenticated) {
        router.push('/login');
    } else {
        setIsPlansOpen(true);
    }
  };
  
   useEffect(() => {
        const handleScroll = () => {
            if (plansScrollRef.current) {
                const scrollLeft = plansScrollRef.current.scrollLeft;
                const cardWidth = plansScrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setActivePlanIndex(newIndex);
            }
        };

        const scroller = plansScrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);
    
  const plans = [
      { id: 'monthly', component: <PlanCard onClick={handlePlansClick} /> },
      // Add more plans here in the future
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'bank':
        return <BankView />;
      case 'assistants':
        return <AssistantsList />;
      case 'products':
        return <ProductsView />;
      case 'credit':
        return <CreditView viewName="Crédito" />;
      case 'home':
      default:
        return (
            <>
                <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
                    <h1 className="text-2xl font-bold">Panel de Miembro</h1>
                    <p className="text-sm text-muted-foreground">Gestiona tus operaciones y asistentes.</p>
                </header>

                <div className="p-4 space-y-4">
                    <div>
                         <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-2">Planes Disponibles</h2>
                         <div className="relative">
                            <div
                                ref={plansScrollRef}
                                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                            >
                                {plans.map(plan => (
                                    <div key={plan.id} className="w-full flex-shrink-0 snap-center">
                                        {plan.component}
                                    </div>
                                ))}
                            </div>
                         </div>
                          {plans.length > 1 && (
                            <div className="flex justify-center space-x-2 mt-2">
                                {plans.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (plansScrollRef.current) {
                                                const cardWidth = plansScrollRef.current.offsetWidth;
                                                plansScrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                                            }
                                        }}
                                        className={cn(
                                            "h-1.5 w-1.5 rounded-full transition-all",
                                            activePlanIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                                        )}
                                        aria-label={`Ir al plan ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                
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
    <PlansDialog isOpen={isPlansOpen} onOpenChange={setIsPlansOpen} />
    </>
  );
};

export default AdminHomePage;
