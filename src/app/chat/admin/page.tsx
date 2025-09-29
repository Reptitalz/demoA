// src/app/chat/admin/page.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Banknote, Bot, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankView, AssistantsList, ProductsView, OtherView as CreditView } from '@/components/chat/admin/AdminViews';

type AdminView = 'home' | 'bank' | 'assistants' | 'products' | 'credit';

const menuItems = [
    { view: 'bank' as AdminView, title: 'Banco', icon: Banknote, area: 'a' },
    { view: 'assistants' as AdminView, title: 'Asistentes', icon: Bot, area: 'b' },
    { view: 'products' as AdminView, title: 'Productos', icon: Package, area: 'c' },
    { view: 'credit' as AdminView, title: 'Crédito', icon: DollarSign, area: 'd' },
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
                <div className="p-4 grid gap-4 grid-cols-2 grid-rows-2 grid-areas-admin-hub h-full">
                    {menuItems.map((item, index) => (
                    <motion.div
                        key={item.view}
                        className="h-full"
                        style={{ gridArea: item.area }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Card
                        onClick={() => setActiveView(item.view)}
                        className={cn(
                            "h-full w-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                            "bg-card/50 hover:bg-card/90 hover:shadow-primary/20 hover:border-primary/30 border-2 border-dashed"
                        )}
                        >
                        <CardContent className="p-0 flex flex-col items-center justify-center gap-2">
                            <item.icon className="h-10 w-10 text-primary" />
                            <p className="font-semibold text-lg">{item.title}</p>
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
