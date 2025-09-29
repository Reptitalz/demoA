// src/app/chat/admin/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Banknote, Bot, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, OtherView as CreditView } from '@/components/chat/admin/AdminViews';

type AdminView = 'home' | 'bank' | 'assistants' | 'products' | 'credit';

const menuItems = [
    { view: 'bank' as AdminView, title: 'Banco', description: "Revisa y autoriza los pagos recibidos.", icon: Banknote, area: 'a' },
    { view: 'assistants' as AdminView, title: 'Asistentes', description: "Supervisa las conversaciones en tiempo real.", icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', description: "Gestiona tu catálogo de productos y servicios.", icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', description: "Administra líneas de crédito para clientes.", icon: DollarSign, area: 'd' },
];

const AdminHomePage = () => {
  const [activeView, setActiveView] = useState<AdminView>('home');

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
                <div className="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 h-full">
                    {menuItems.map((item, index) => (
                    <motion.div
                        key={item.view}
                        className="h-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card
                            onClick={() => setActiveView(item.view)}
                            className={cn(
                                "h-full w-full flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300",
                                "bg-card/50 hover:bg-card/90 hover:shadow-primary/10 hover:border-primary/20 border"
                            )}
                        >
                            <CardHeader>
                                <div className="p-3 bg-primary/10 rounded-full mx-auto">
                                    <item.icon className="h-8 w-8 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                <CardDescription className="text-xs mt-1">{item.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </motion.div>
                    ))}
                </div>
            </>
        );
    }
  };

  return (
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
  );
};

export default AdminHomePage;
