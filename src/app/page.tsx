

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaWhatsapp, FaBrain, FaCogs, FaShieldAlt, FaSitemap, FaMoneyBillWave } from 'react-icons/fa';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";


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
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center">💬</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Hey Manito</p>
                    <p className="text-xs text-slate-400">Activo</p>
                  </div>
                </div>
                <div className="text-slate-400 text-xs">—</div>
              </div>

              <div className="px-4 pb-6">
                <div className="mt-2 space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white p-3 rounded-2xl">Hola 👋 ¿En qué puedo ayudarte hoy?</div>
                  </div>

                  <div className="flex">
                    <div className="max-w-[70%] bg-slate-800 text-slate-200 p-3 rounded-2xl">Quiero ver mi reporte de ventas y las imágenes autorizadas.</div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white p-3 rounded-2xl">Genial — te muestro un resumen con asistentes.</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-gradient-to-t from-slate-900/60">
                <div className="flex items-center gap-3">
                  <input className="flex-1 rounded-full bg-slate-800/70 px-4 py-2 text-sm placeholder:text-slate-400 text-white" placeholder="Escribe un mensaje..." />
                  <button className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm">Enviar</button>
                </div>
              </div>
            </motion.div>
    );
};

const FeatureCard = ({ title, desc, icon }: { title: string, desc: string, icon: React.FC }) => {
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-primary">{icon()}</div>
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="text-slate-300 text-sm mt-1">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

const UIShowcase = ({ title, badge }: { title: string, badge: string }) => {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">{title}</p>
        <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white">{badge}</span>
      </div>
      <div className="mt-4 h-36 rounded-lg border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/30 flex items-center justify-center text-slate-400">Interfaz demo</div>
    </div>
  );
}

const PricingCard = ({ name, price, features, recommended }: { name: string, price: string, features: string[], recommended?: boolean }) => {
  return (
    <div className={`p-6 rounded-xl border ${recommended ? "border-primary scale-[1.02] bg-gradient-to-br from-white/10 to-white/10 backdrop-blur-sm" : "border-white/10"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-slate-300 text-sm mt-1">{price}</p>
        </div>
        {recommended && <div className="text-xs px-3 py-1 rounded-full bg-primary text-white">Recomendado</div>}
      </div>

      <ul className="mt-4 text-slate-300 space-y-2">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>

      <div className="mt-6">
        <Link href="/begin" className={`inline-block w-full text-center px-4 py-3 rounded-full ${recommended ? "bg-primary text-white" : "bg-white/10 text-white"}`}>Seleccionar</Link>
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
                {APP_NAME} es una PWA con interfaz tipo mensajería —como WhatsApp— pero potenciada
                con asistentes inteligentes que automatizan ventas, gestionan clientes, almacenan
                chats y controlan imágenes mediante autorizaciones al propietario.
                </motion.p>

                <div className="mt-8 flex gap-4">
                <Link
                    href="/begin"
                    className="inline-flex items-center gap-3 bg-brand-gradient px-5 py-3 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform text-primary-foreground"
                >
                    Instalar PWA
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
                    <p className="text-xs text-slate-300">Asistentes inteligentes</p>
                    <p className="font-semibold text-white">Automatiza respuestas y ventas</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10">
                    <p className="text-xs text-slate-300">Control de imágenes</p>
                    <p className="font-semibold text-white">Permisos por propietario</p>
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
                    title="Asistentes inteligentes"
                    desc="Automatiza respuestas, crea flujos de venta y asigna tareas a asistentes personalizados."
                    icon={() => <FaCogs size={24} />}
                    />
                    <FeatureCard
                    title="Almacenamiento de chats"
                    desc="Historial seguro y exportable — busca, etiqueta y retoma conversaciones en segundos."
                    icon={() => <FaBrain size={24} />}
                    />
                    <FeatureCard
                    title="Control de imágenes"
                    desc="Autoriza quién puede ver o usar imágenes; todo controlado por el propietario."
                    icon={() => <FaShieldAlt size={24} />}
                    />
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                    <h4 className="font-semibold text-white">Gestión de ventas y ganancias</h4>
                    <p className="text-slate-300 mt-2">Reportes en tiempo real y paneles resumidos para ver comisiones, ventas y tendencias.</p>
                    <ul className="mt-4 space-y-2 text-slate-300">
                        <li>• Resumen diario y mensual</li>
                        <li>• Exportar a CSV</li>
                        <li>• Integración con pasarelas (simulada/real)</li>
                    </ul>
                    </div>

                    <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-sm">
                    <h4 className="font-semibold text-white">Privacidad y permisos</h4>
                    <p className="text-slate-300 mt-2">El propietario de la imagen define permisos por medio de autorizaciones —auditables desde el panel.</p>
                    <ul className="mt-4 space-y-2 text-slate-300">
                        <li>• Registros de autorización</li>
                        <li>• Revocación instantánea</li>
                        <li>• Descargas con firma</li>
                    </ul>
                    </div>
                </div>
            </section>

            <section id="ui" className="max-w-6xl mx-auto px-6 py-20">
                <h3 className="text-2xl font-bold text-white">Interfaz y experiencia</h3>
                <p className="text-slate-300 mt-2 max-w-2xl">Diseñada para ser familiar y rápida — la transición desde aplicaciones de mensajería es natural y la PWA permite instalar la app para uso offline y notificaciones.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <UIShowcase title="Chat" badge="Rápido" />
                    <UIShowcase title="Panel de ventas" badge="Analítica" />
                    <UIShowcase title="Control de imágenes" badge="Seguro" />
                </div>
            </section>

            <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
                <h3 className="text-2xl font-bold text-white">Planes</h3>
                <p className="text-slate-300 mt-2 max-w-2xl">Planes pensados para negocios pequeños y medianos; comienza gratis y escala según tus necesidades.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PricingCard name="Gratis" price="0" features={["Chat básico", "1 asistente", "100MB media"]} />
                    <PricingCard name="Pro" price="$9 / mes" features={["Asistentes ilimitados", "Historial completo", "1GB media"]} recommended />
                    <PricingCard name="Empresa" price="Contactar" features={["SLA", "Integraciones", "Control avanzado"]} />
                </div>
            </section>

            <section id="get" className="max-w-6xl mx-auto px-6 py-20 text-center">
                <h3 className="text-2xl font-bold text-white">¿Listo para probar {APP_NAME}?</h3>
                <p className="text-slate-300 mt-2">Prueba la PWA en tu dispositivo y comienza a automatizar tus ventas con asistentes inteligentes.</p>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <Link href="/begin" className="px-6 py-3 rounded-full bg-brand-gradient text-white font-medium">Instalar PWA</Link>
                    <Link href="#contact" className="px-6 py-3 rounded-full border border-white/10 text-white">Contactar ventas</Link>
                </div>
            </section>
        </main>
    </PageContainer>
  );
}
