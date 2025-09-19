
"use client";

import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaWhatsapp, FaBrain, FaCogs, FaShieldAlt, FaSitemap, FaMoneyBillWave, FaHandshake, FaUserTie } from 'react-icons/fa';
import { Send, Bot, Database, Workflow, CheckCircle, Rocket, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';


const PhoneChatMockup = () => {
    return (
        <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mx-auto w-[360px] h-[720px] rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-900/70 shadow-2xl border border-white/5 overflow-hidden"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center"><Bot size={24} className="text-white"/></div>
                  <div>
                    <p className="text-sm font-semibold text-white">Asistente de Ventas</p>
                    <p className="text-xs text-slate-400">en línea</p>
                  </div>
                </div>
                <div className="text-slate-400 text-xs">—</div>
              </div>

              <div className="px-4 pb-6">
                <div className="mt-2 space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white p-3 rounded-2xl">¡Hola! 👋 Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?</div>
                  </div>

                  <div className="flex">
                    <div className="max-w-[70%] bg-slate-800 text-slate-200 p-3 rounded-2xl">Quiero ver el inventario de productos y generar un reporte de ventas.</div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white p-3 rounded-2xl">Claro, consultando la base de datos... Tu reporte está listo. ¿Te lo envío?</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-gradient-to-t from-slate-900/60">
                <div className="flex items-center gap-3">
                  <input className="flex-1 rounded-full bg-slate-800/70 px-4 py-2 text-sm placeholder:text-slate-400 text-white" placeholder="Escribe un mensaje..." />
                  <button className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm">Enviar</button>
                </div>
              </div>
            </motion.div>
    );
};

const FeatureCard = ({ title, desc, icon: Icon }: { title: string, desc: string, icon: React.FC | React.ElementType }) => {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-primary"><Icon size={28} /></div>
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="text-slate-300 text-sm mt-1">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

const UIShowcase = ({ title, badge }: { title: string, badge: string }) => {
  const renderPreview = () => {
    switch (title) {
      case 'Dashboard':
        return (
          <div className="p-2 space-y-1">
            <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
            <div className="flex gap-1">
              <div className="h-6 w-1/3 bg-slate-700/50 rounded"></div>
              <div className="h-6 w-1/3 bg-slate-700/50 rounded"></div>
              <div className="h-6 w-1/3 bg-slate-700/50 rounded"></div>
            </div>
            <div className="h-12 bg-slate-700/50 rounded-md flex items-end p-1 gap-0.5">
                <div className="w-1/4 h-1/2 bg-primary/40 rounded-t-sm"></div>
                <div className="w-1/4 h-3/4 bg-primary/40 rounded-t-sm"></div>
                <div className="w-1/4 h-1/3 bg-primary/40 rounded-t-sm"></div>
                <div className="w-1/4 h-full bg-primary/40 rounded-t-sm"></div>
            </div>
             <div className="h-8 bg-slate-700/50 rounded-md"></div>
          </div>
        );
      case 'Cerebro':
        return (
           <div className="p-2 space-y-1">
              <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
              <div className="h-8 bg-slate-700/50 rounded-md flex items-center p-1 gap-1">
                <div className="h-full w-6 bg-primary/40 rounded"></div>
                <div className="h-2/3 w-2/3 bg-slate-600/80 rounded-sm"></div>
              </div>
              <div className="h-8 bg-slate-700/50 rounded-md flex items-center p-1 gap-1">
                <div className="h-full w-6 bg-primary/40 rounded"></div>
                <div className="h-2/3 w-1/2 bg-slate-600/80 rounded-sm"></div>
              </div>
              <div className="h-8 bg-slate-700/50 rounded-md flex items-center p-1 gap-1">
                 <div className="h-full w-6 bg-primary/40 rounded"></div>
                <div className="h-2/3 w-3/4 bg-slate-600/80 rounded-sm"></div>
              </div>
          </div>
        );
      case 'Chat':
        return (
          <div className="p-2 space-y-1">
            <div className="flex justify-end"><div className="h-3 w-2/3 bg-primary/40 rounded-full"></div></div>
            <div className="flex justify-start"><div className="h-3 w-1/2 bg-slate-700/80 rounded-full"></div></div>
            <div className="flex justify-start"><div className="h-3 w-1/3 bg-slate-700/80 rounded-full"></div></div>
            <div className="flex justify-end"><div className="h-3 w-3/4 bg-primary/40 rounded-full"></div></div>
            <div className="absolute bottom-2 left-2 right-2 h-4 bg-slate-800 rounded-full"></div>
          </div>
        );
      default:
        return <p className="text-slate-400">Interfaz de {title}</p>;
    }
  };
  
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{title}</p>
        <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white">{badge}</span>
      </div>
      <div className="mt-4 h-36 rounded-lg border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 flex-col items-center justify-center text-slate-400 relative overflow-hidden">
        {renderPreview()}
      </div>
    </div>
  );
}

const PricingCard = ({ name, price, description, features, recommended, buttonText, buttonLink }: { name: string, price: string, description: string, features: string[], recommended?: boolean, buttonText: string, buttonLink: string }) => {
  return (
    <div className={`p-6 rounded-xl border flex flex-col ${recommended ? "border-primary scale-[1.02] bg-gradient-to-br from-white/10 to-white/10 backdrop-blur-sm" : "border-white/10"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-slate-300 text-sm mt-1">{price}</p>
        </div>
        {recommended && <div className="text-xs px-3 py-1 rounded-full bg-primary text-white">Recomendado</div>}
      </div>
      <p className="text-sm text-slate-400 mt-4 flex-grow">{description}</p>
      <ul className="mt-4 text-slate-300 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-400 mt-1 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href={buttonLink} className={`inline-block w-full text-center px-4 py-3 rounded-full ${recommended ? "bg-primary text-white" : "bg-white/10 text-white"}`}>{buttonText}</Link>
      </div>
    </div>
  );
}

export default function MarketingHomePage() {

  return (
    <PageContainer className="flex flex-col items-center py-0 animate-fadeIn" fullWidth={true}>
        <main className="relative z-20 w-full">
            <section className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
                <motion.h2
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-extrabold leading-tight text-white"
                >
                Tu centro de atención al cliente, ahora <span className="text-brand-gradient">inteligente.</span>
                </motion.h2>

                <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.6 }}
                className="mt-6 text-slate-300 max-w-xl"
                >
                {APP_NAME} es una PWA con interfaz tipo mensajería, potenciada
                con asistentes inteligentes que automatizan ventas, gestionan clientes y almacenan
                chats. Todo configurable desde un simple prompt.
                </motion.p>

                <div className="mt-8 flex gap-4">
                <Link
                    href="/begin"
                    className="inline-flex items-center gap-3 bg-brand-gradient px-5 py-3 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform text-primary-foreground"
                >
                    Comenzar Ahora
                </Link>
                <a
                    href="#features"
                    className="inline-flex items-center gap-3 border border-slate-700 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/5 transition"
                >
                    Ver funciones
                </a>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm">
                <div className="p-3 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-slate-300">Asistentes Inteligentes</p>
                    <p className="font-semibold text-white">Automatiza respuestas y ventas</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-slate-300">Integra con WhatsApp</p>
                    <p className="font-semibold text-white">Atención 24/7</p>
                </div>
                </div>
            </div>

            <div className="relative">
                <PhoneChatMockup />
                <div className="absolute -top-8 -right-8 w-44 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hidden md:block">
                    <p className="text-xs text-slate-300">Ventas hoy</p>
                    <p className="font-bold text-white">$3,420</p>
                </div>

                <div className="absolute -bottom-12 -left-8 w-48 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hidden md:block">
                    <p className="text-xs text-slate-300">Clientes nuevos</p>
                    <p className="font-bold text-white">+12</p>
                </div>
            </div>
            </section>

            <section id="features" className="max-w-6xl mx-auto px-6 py-20">
                <h3 className="text-2xl font-bold text-white">Funciones destacadas</h3>
                <p className="text-slate-300 mt-2 max-w-2xl">Todo lo que necesitas para administrar clientes y ventas desde una sola PWA ligera.</p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                    title="Asistentes por Prompt"
                    desc="Crea y personaliza el comportamiento de tus asistentes usando lenguaje natural."
                    icon={Workflow}
                    />
                    <FeatureCard
                    title="Integración WhatsApp"
                    desc="Conecta un número de teléfono y automatiza tu comunicación en la plataforma de mensajería más grande."
                    icon={FaWhatsapp}
                    />
                    <FeatureCard
                    title="Bases de Datos Inteligentes"
                    desc="Tu asistente aprende y responde basándose en el conocimiento que le proporcionas, ya sea desde un archivo o una Hoja de Google."
                    icon={FaBrain}
                    />
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                    <h4 className="font-semibold text-white">Panel de Control Centralizado</h4>
                    <p className="text-slate-300 mt-2">Gestiona todos tus asistentes, bases de datos, planes y créditos desde una interfaz unificada e intuitiva.</p>
                    <ul className="mt-4 space-y-2 text-slate-300">
                        <li>• Vista general de consumo</li>
                        <li>• Configuración detallada</li>
                        <li>• Acceso a historial de chats</li>
                    </ul>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                    <h4 className="font-semibold text-white">Programa de Colaboradores</h4>
                    <p className="text-slate-300 mt-2">Gana comisiones recurrentes recomendando Hey Manito a otros negocios. Te damos las herramientas para triunfar.</p>
                    <ul className="mt-4 space-y-2 text-slate-300">
                        <li>• Enlace de referido único</li>
                        <li>• Panel de seguimiento de ganancias</li>
                        <li>• Material de marketing</li>
                    </ul>
                    </div>
                </div>
            </section>

            <section id="ui" className="max-w-6xl mx-auto px-6 py-20">
                <h3 className="text-2xl font-bold text-white">Interfaz y experiencia</h3>
                <p className="text-slate-300 mt-2 max-w-2xl">Diseñada para ser familiar y rápida — la transición desde aplicaciones de mensajería es natural y la PWA permite instalar la app para uso offline y notificaciones.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <UIShowcase title="Dashboard" badge="Gestión" />
                    <UIShowcase title="Cerebro" badge="Conocimiento" />
                    <UIShowcase title="Chat" badge="Comunicación" />
                </div>
            </section>

            <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
                <h3 className="text-2xl font-bold text-white">Planes Flexibles</h3>
                <p className="text-slate-300 mt-2 max-w-2xl">Comienza gratis y escala según tus necesidades. Sin contratos, sin complicaciones.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PricingCard 
                        name="Asistente Desktop" 
                        price="Prueba Gratuita por 30 Días" 
                        description="Ideal para probar, desarrollar y para uso interno. Sin necesidad de un número de teléfono."
                        features={["Mensajes ilimitados", "Configuración completa", "Acceso vía web"]}
                        buttonText="Comenzar Prueba"
                        buttonLink="/begin"
                    />
                    <PricingCard 
                        name="Asistente WhatsApp" 
                        price="Pago por Uso"
                        description="Paga solo por lo que necesitas. Compra créditos y asígnalos a tus asistentes de WhatsApp."
                        features={["Atención 24/7 en WhatsApp", "Requiere un número de teléfono nuevo", "Sistema de recarga de créditos flexible"]}
                        recommended 
                        buttonText="Crear Asistente"
                        buttonLink="/begin"
                    />
                    <PricingCard 
                        name="Programa de Aliados" 
                        price="Gana Comisiones" 
                        description="Únete a nuestro programa de colaboradores y obtén ingresos recurrentes por cada cliente que refieras."
                        features={["Panel de seguimiento exclusivo", "Comisiones por recargas", "Soporte para tus clientes"]}
                        buttonText="Más Información"
                        buttonLink="/colaboradores"
                    />
                </div>
            </section>

            <section id="get" className="max-w-6xl mx-auto px-6 py-20 text-center">
                <h3 className="text-2xl font-bold text-white">¿Listo para probar {APP_NAME}?</h3>
                <p className="text-slate-300 mt-2">Instala la PWA en tu dispositivo y comienza a automatizar tus ventas con asistentes inteligentes.</p>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <Link href="/begin" className="px-6 py-3 rounded-full bg-brand-gradient text-white font-medium">Crear mi Primer Asistente</Link>
                    <Link href="#contact" className="px-6 py-3 rounded-full border border-white/10 text-white">Contactar</Link>
                </div>
            </section>
        </main>
    </PageContainer>
  );
}

    