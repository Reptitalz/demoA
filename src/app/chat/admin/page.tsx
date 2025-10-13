
// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Package, DollarSign, ArrowLeft, Star, MessageCircle, ShoppingCart, Landmark, CreditCard, XCircle, ShieldCheck, Crown, CheckSquare, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, CreditView, DeliveryView } from '@/components/chat/admin/AdminViews';
import { Button } from '@/components/ui/button';
import PlansDialog from '@/components/dashboard/PlansDialog';
import { useApp } from '@/providers/AppProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { List, ListItem } from '@/components/ui/list';
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

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: 'easeIn' } },
};

const menuItems = [
    { view: 'bank' as AdminView, title: 'Autorizaciones', description: "Revisa y autoriza pagos y documentos.", icon: CheckSquare, area: 'a' },
    { view: 'bots' as AdminView, title: 'Bots', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
    { view: 'delivery' as AdminView, title: 'Repartidores', description: "Gestiona pedidos y rutas de entrega.", icon: Truck, area: 'e' },
];

const AdminHomePageContent = () => (
    <>
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
            <h1 className="text-2xl font-bold">Panel de Miembro</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus operaciones y asistentes.</p>
        </header>
        <div className="p-4 md:p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="p-0 md:p-4 grid gap-3 grid-cols-2">
                    {menuItems.map((item, index) => (
                        <motion.div
                            key={item.view}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="aspect-square"
                        >
                            <Card
                                onClick={() => {
                                  const router = useRouter();
                                  router.push(`/chat/admin?view=${item.view}`, { scroll: false });
                                }}
                                className={cn(
                                    "h-full w-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
                                    "bg-card/50 hover:bg-card/90 hover:shadow-primary/10 hover:border-primary/20 border"
                                )}
                            >
                                <CardHeader className="p-2">
                                    <div className="p-3 bg-primary/10 rounded-full mx-auto">
                                        <item.icon className="h-5 w-5 text-primary" />
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
        </div>
    </>
);

const views: Record<AdminView, React.ComponentType> = {
    home: AdminHomePageContent,
    bank: BankView,
    bots: AssistantsList,
    products: ProductsView,
    credit: CreditView,
    delivery: DeliveryView,
};

export default function AdminHomePage() {
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = state.userProfile;
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  const activeView = (searchParams.get('view') as AdminView) || 'home';

  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
        router.push('/login');
    } else {
        setIsPlansOpen(true);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/chat/dashboard');
  }
  
  const handleBackToAdminHome = () => {
    router.push('/chat/admin');
  }

  return (
    <>
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {activeView !== 'home' && (
         <div className="p-2 border-b bg-card/80 backdrop-blur-sm flex justify-between items-center">
            <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Volver a los chats
            </button>
        </div>
      )}
      <div className="flex-grow relative">
        <AnimatePresence initial={false} mode="wait">
            {Object.entries(views).map(([view, Component]) => {
                return activeView === view && (
                     <motion.div
                        key={view}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="h-full w-full overflow-y-auto"
                     >
                        <Component />
                    </motion.div>
                )
            })}
        </AnimatePresence>
      </div>
    </div>
    <PlansDialog isOpen={isPlansOpen} onOpenChange={setIsPlansOpen} />
    </>
  );
}

type AdminView = 'home' | 'bank' | 'bots' | 'products' | 'credit' | 'delivery';
