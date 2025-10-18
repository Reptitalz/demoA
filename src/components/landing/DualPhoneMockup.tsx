
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaWhatsapp } from 'react-icons/fa';
import AppIcon from '../shared/AppIcon';
import { cn } from '@/lib/utils';

const Phone = ({ children, className, rotation, animationDelay }: { children: React.ReactNode, className?: string, rotation: number, animationDelay: number }) => (
    <motion.div
        className={cn("w-[220px] h-[450px] bg-slate-900 rounded-[30px] border-8 border-slate-800 shadow-2xl overflow-hidden relative", className)}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1, rotate: rotation }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, delay: animationDelay }}
    >
        <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: animationDelay }}
            className="h-full w-full"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-lg z-20" />
            <div className="absolute inset-1.5 bg-background rounded-[22px] flex flex-col overflow-hidden">
                {children}
            </div>
        </motion.div>
    </motion.div>
);

const DashboardScreen = () => (
    <>
        <div className="flex-shrink-0 p-3 bg-card border-b z-10 flex items-center gap-2">
            <AppIcon className="h-6 w-6" />
            <h2 className="font-bold text-sm">Mis Asistentes</h2>
        </div>
        <div className="flex-grow p-3 space-y-2 overflow-y-auto">
            {[
                { name: 'Asistente de Ventas', iconColor: 'text-blue-500', status: 'Activo' },
                { name: 'Soporte Técnico', iconColor: 'text-green-500', status: 'Activo' },
                { name: 'Agente de Citas', iconColor: 'text-purple-500', status: 'Inactivo' },
            ].map((asst, i) => (
                <div key={i} className="bg-card p-2 rounded-lg border flex items-center gap-2">
                    <div className={cn("p-2 rounded-full", asst.iconColor === 'text-blue-500' ? 'bg-blue-100' : asst.iconColor === 'text-green-500' ? 'bg-green-100' : 'bg-purple-100')}>
                        <FaRobot className={cn("h-4 w-4", asst.iconColor)} />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-xs truncate">{asst.name}</p>
                        <p className={cn("text-[10px]", asst.status === 'Activo' ? 'text-green-500' : 'text-muted-foreground')}>{asst.status}</p>
                    </div>
                </div>
            ))}
        </div>
    </>
);

const WhatsAppScreen = () => (
    <>
        <div className="flex-shrink-0 p-2.5 bg-[#005E54] z-10 flex items-center gap-2 text-white">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <FaWhatsapp className="h-5 w-5 text-gray-600" />
            </div>
            <div>
                <p className="font-semibold text-sm">Cliente</p>
                <p className="text-xs opacity-80">en línea</p>
            </div>
        </div>
        <div className="flex-grow p-3 flex flex-col gap-2 overflow-y-auto bg-[#E5DDD5] chat-background">
            <div className="self-end bg-white rounded-lg p-2 max-w-[80%] text-sm shadow">Hola, ¿tienen pizzas?</div>
            <div className="self-start bg-[#DCF8C6] rounded-lg p-2 max-w-[80%] text-sm shadow">¡Hola! Sí, tenemos de Peperoni, Hawaiana y Mexicana.</div>
            <div className="self-end bg-white rounded-lg p-2 max-w-[80%] text-sm shadow">Una de peperoni, por favor.</div>
            <div className="self-start bg-[#DCF8C6] rounded-lg p-2 max-w-[80%] text-sm shadow">Claro, son $150. ¿Confirmo tu pedido?</div>
        </div>
        <div className="flex-shrink-0 p-2 bg-[#F0F2F5] border-t z-10 flex items-center gap-2">
            <div className="flex-grow bg-white rounded-full h-8" />
            <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center">
                <FaWhatsapp className="text-white h-4 w-4" />
            </div>
        </div>
    </>
);

const DualPhoneMockup = () => {
    return (
        <div className="w-full h-full flex justify-center items-center gap-4">
            <Phone rotation={-5} animationDelay={0}>
                <DashboardScreen />
            </Phone>
            <Phone rotation={5} animationDelay={0.2}>
                <WhatsAppScreen />
            </Phone>
        </div>
    );
};

export default DualPhoneMockup;
