// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Bot, Package, DollarSign, ArrowLeft, Star, MessageCircle, ShoppingCart, Landmark, CreditCard, XCircle, ShieldCheck, Crown, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, CreditView } from '@/components/chat/admin/AdminViews';
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

export default function AdminHomePage() {
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = state.userProfile;
  const [activeView, setActiveView] = useState<AdminView>('home');
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  useEffect(() => {
    const view = searchParams.get('view') as AdminView;
    if (view && ['bank', 'bots', 'products', 'credit'].includes(view)) {
      setActiveView(view);
    } else {
      setActiveView('home');
    }
  }, [searchParams]);
  
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
                                    onClick={() => setActiveView(item.view)}
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
                        <div className="px-2">
                            {/* The PlanCarousel is now inside PlansDialog, which can be triggered from anywhere */}
                        </div>
                    </div>
                </div>
            </>
        );
    }
  };
  
  const menuItems = [
    { view: 'bank' as AdminView, title: 'Autorizaciones', description: "Revisa y autoriza pagos y documentos.", icon: CheckSquare, area: 'a' },
    { view: 'bots' as AdminView, title: 'Bots', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
];

  const handleBackToDashboard = () => {
    setActiveView('home');
    router.push('/chat/dashboard');
  }

  return (
    <>
    <div className="flex flex-col h-full bg-transparent">
      {activeView !== 'home' && (
         <div className="p-2 border-b bg-card/80 backdrop-blur-sm">
            <button onClick={handleBackToDashboard} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Volver al panel de chats
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
}

type AdminView = 'home' | 'bank' | 'bots' | 'products' | 'credit';

const menuItems = [
    { view: 'bank' as AdminView, title: 'Autorizaciones', description: "Revisa y autoriza pagos y documentos.", icon: CheckSquare, area: 'a' },
    { view: 'bots' as AdminView, title: 'Bots', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
];
