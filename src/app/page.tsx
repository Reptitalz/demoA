
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { FaCheck, FaArrowRight, FaRobot, FaCog, FaMobileAlt, FaBrain, FaUniversity, FaCreditCard, FaApple, FaDownload, FaSpinner, FaAndroid, FaPaperPlane, FaGooglePlay, FaTimes, FaGoogle, FaVideo, FaImages, FaBook, FaBullhorn, FaMicrophone } from 'react-icons/fa';
import { motion } from "framer-motion";
import AppIcon from '@/components/shared/AppIcon';
import { HandCoins, ShoppingCart } from 'lucide-react';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import DualPhoneMockup from '@/components/landing/DualPhoneMockup';


const tools = [
  { icon: FaGoogle, title: 'Google Sheets', description: 'Usa bases de datos existentes.' },
  { icon: FaVideo, title: 'Vídeos', description: 'Recibe y autoriza contenido multimedia.' },
  { icon: FaImages, title: 'Imágenes', description: 'Envía y recibe imágenes para catálogos o soporte.' },
  { icon: FaMicrophone, title: 'Audios', description: 'Recibe y procesa mensajes de audio de tus clientes.' },
  { icon: ShoppingCart, title: 'Catálogo de Productos', description: 'Promociona y vende tus productos.' },
  { icon: FaCreditCard, title: 'Créditos', description: 'Ofrece y gestiona líneas de crédito.' },
  { icon: HandCoins, title: 'Cobranza', description: 'Automatiza recordatorios de pago a clientes.' },
  { icon: FaBook, title: 'Aprendizaje', description: 'Aprende de tus clientes para reconocerlos.' },
  { icon: FaBullhorn, title: 'Notificaciones', description: 'Informa al propietario de eventos importantes.' },
];

const ToolsCarousel = () => {
    return (
        <div
            className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]"
        >
            <ul className="flex items-center justify-center md:justify-start [&_li]:mx-4 [&_img]:max-w-none animate-scroll">
                {[...tools, ...tools].map((tool, index) => {
                    const Icon = tool.icon;
                    return (
                       <li key={index} className="flex-shrink-0 w-64 p-3">
                            <div className="h-full bg-card/50 border rounded-lg p-4 flex items-center gap-4 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-lg">
                                <Icon className="h-8 w-8 text-primary shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-sm">{tool.title}</h3>
                                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


type DeviceType = 'ios' | 'android' | 'web' | 'loading';

const NewHomepage = () => {
  const [device, setDevice] = useState<DeviceType>('loading');

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setDevice('ios');
    } else if (/android/i.test(userAgent)) {
      setDevice('android');
    } else {
      setDevice('web');
    }
  }, []);

  const downloadConfig = {
    ios: {
      icon: <FaApple className="mr-2" />,
      text: 'Descargar para iPhone',
      href: '/app.ipa',
      download: true,
    },
    android: {
      icon: <FaAndroid className="mr-2" />,
      text: 'Descargar para Android',
      href: '/app.apk',
      download: true,
    },
    web: {
      icon: <FaDownload className="mr-2" />,
      text: 'Instalar App',
      href: '/access',
      download: false,
    },
    loading: {
      icon: <FaSpinner className="mr-2 animate-spin" />,
      text: 'Detectando...',
      href: '#',
      download: false,
    },
  };

  const currentDownload = downloadConfig[device];

  const comparisonFeatures = [
    { feature: 'Asistentes Ilimitados', free: true, member: true },
    { feature: 'Límite de Mensajes (IA)', free: '100 / día', member: 'Ilimitados' },
    { feature: 'Gestión de Banco (Transacciones)', free: '100 / día', member: 'Ilimitadas' },
    { feature: 'Catálogo de Productos', free: '5 productos', member: 'Ilimitados' },
    { feature: 'Gestión de Créditos', free: '1 línea', member: 'Múltiples' },
    { feature: 'Soporte', free: 'Comunitario', member: 'Prioritario' },
  ];

  return (
    <PageContainer className="p-0" fullWidth={true}>
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
          <div 
            className="absolute inset-0 z-0 opacity-20"
            style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.1), transparent 60%), radial-gradient(circle, hsl(var(--accent) / 0.05), transparent 70%)',
            }}
          />
          <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center md:text-left"
              >
                  <AppIcon className="h-20 w-20 mx-auto md:mx-0 mb-4" />
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                      La Red Social con <span className="text-brand-gradient">Superpoderes de IA.</span> Gratis.
                  </h1>
                  <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-muted-foreground">
                      Hey Manito! es la evolución del chat. Chatea, vende, y automatiza tu negocio con asistentes de IA, todo desde una plataforma gratuita.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <Button asChild size="lg" className="w-full sm:w-auto bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border">
                        <Link href={"/load"}>
                            <FaRobot className="mr-2" />
                            Crear Asistente Gratis
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 hover:text-white border-black">
                        <Link href={"#"}>
                            <FaGooglePlay className="mr-2" />
                            <div>
                                <p className="text-xs text-left leading-tight">Disponible en</p>
                                <p className="text-lg font-semibold leading-tight">Google Play</p>
                            </div>
                        </Link>
                    </Button>
                  </div>
                  <div className="mt-6 flex justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><FaGoogle size={14} className="text-blue-500" /> Accedes con tu cuenta Google</span>
                  </div>
              </motion.div>
              <motion.div 
                className="h-[500px] w-full max-w-sm mx-auto flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
               >
                  <DualPhoneMockup />
              </motion.div>
          </div>
      </section>

      <section id="features" className="py-20 bg-muted/50">
        <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight">Herramientas Poderosas para tus Asistentes</h2>
                <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Equipa a tus asistentes con capacidades avanzadas para automatizar cualquier tarea.</p>
            </div>
            <ToolsCarousel />
        </div>
      </section>


      <section className="py-20 bg-background">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Empieza en Minutos</h2>
            <p className="mt-3 text-muted-foreground">Crea y gestiona tu negocio en 3 simples pasos.</p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-center">
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaRobot className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Crea y Supervisa tus Bots</p>
                  <p className="text-sm text-muted-foreground">Chatea y gestiona tus asistentes desde un panel centralizado.</p>
              </div>
              <FaArrowRight className="text-primary opacity-50 hidden md:block" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaCreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Gestiona Productos y Créditos</p>
                  <p className="text-sm text-muted-foreground">Usa el catálogo de productos y administra líneas de crédito para clientes.</p>
              </div>
               <FaArrowRight className="text-primary opacity-50 hidden md:block" />
              <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-16 w-16 mb-2">
                        <FaUniversity className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Controla tus Finanzas</p>
                  <p className="text-sm text-muted-foreground">Revisa y autoriza los pagos que reciben tus asistentes en la sección 'Banco'.</p>
              </div>
          </div>
        </div>
      </section>
      
       <section id="pricing" className="py-20 bg-muted/50">
          <div className="container max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Planes Simples y Flexibles</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Comienza gratis. Crece sin complicaciones.</p>
              
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <div className="border border-border rounded-lg p-8 flex flex-col">
                      <h3 className="text-2xl font-semibold">Plan Gratuito</h3>
                      <p className="mt-2 text-muted-foreground">Perfecto para empezar a explorar.</p>
                      <div className="my-8">
                          <span className="text-5xl font-extrabold">$0</span>
                          <span className="text-muted-foreground"> /siempre</span>
                      </div>
                      <ul className="space-y-3 text-left">
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Asistentes Ilimitados</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> 100 mensajes por día (total)</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Acceso a todas las funciones de gestión</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Instalación como PWA</li>
                      </ul>
                      <div className="mt-auto pt-6 text-center">
                          <p className="text-xs text-muted-foreground mb-2">No se requiere tarjeta.</p>
                      </div>
                  </div>

                  <div className="relative border-2 border-primary rounded-lg p-8 flex flex-col shadow-2xl shadow-primary/20">
                       <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Recomendado</div>
                      </div>
                      <h3 className="text-2xl font-semibold">Plan miembro</h3>
                      <p className="mt-2 text-muted-foreground">Desbloquea todo el potencial para tu negocio.</p>
                       <div className="my-8">
                          <span className="text-5xl font-extrabold">$179</span>
                          <span className="text-muted-foreground"> /mes</span>
                      </div>
                      <ul className="space-y-3 text-left">
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Todo lo del Plan Gratuito, y además:</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Mensajes Ilimitados</li>
                           <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Transacciones Ilimitadas</li>
                          <li className="flex items-center gap-3"><FaCheck className="h-5 w-5 text-green-500" /> Soporte Prioritario</li>
                      </ul>
                       <div className="mt-auto pt-6 text-center">
                          <p className="text-xs text-muted-foreground mb-2">Pagos seguros vía Google Play</p>
                          <div className="flex justify-center items-center gap-3">
                              <FaCcVisa className="h-6 w-6 text-muted-foreground" />
                              <FaCcMastercard className="h-6 w-6 text-muted-foreground" />
                              <FaCcAmex className="h-6 w-6 text-muted-foreground" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <section className="py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold tracking-tight">¿Listo para Probar {APP_NAME}?</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                  Instala la PWA en tu dispositivo y comienza a automatizar tus ventas con asistentes inteligentes.
              </p>
              <p className="mt-8 font-semibold text-primary">Próximamente para iPhone...</p>
               <div className="mt-8 flex justify-center items-center gap-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FaApple className="h-8 w-8" />
                  <span className="text-sm">iPhone</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FaAndroid className="h-8 w-8" />
                  <span className="text-sm">Android</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FaMobileAlt className="h-8 w-8" />
                  <span className="text-sm">Web</span>
                </div>
              </div>
          </div>
      </section>

      <section id="faq" className="py-20 bg-muted/50">
          <div className="container max-w-3xl mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold tracking-tight">Preguntas Frecuentes</h2>
                  <p className="mt-3 text-muted-foreground">Resolvemos tus dudas más comunes.</p>
              </div>
              <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>¿Qué es Hey Manito exactamente?</AccordionTrigger>
                      <AccordionContent>
                          Hey Manito es una plataforma que combina una red social de chat con la capacidad de crear y gestionar asistentes de inteligencia artificial. Puedes usarla para chatear con contactos o para que tus asistentes de IA atiendan a tus clientes, tomen pedidos, respondan preguntas y mucho más.
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                      <AccordionTrigger>¿Cómo funciona el asistente de IA?</AccordionTrigger>
                      <AccordionContent>
                          Tú defines el comportamiento del asistente mediante un "prompt", que son instrucciones en lenguaje natural. Además, puedes conectar una Hoja de Google como base de datos para que el asistente responda con información específica de tu negocio (productos, precios, etc.).
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                      <AccordionTrigger>¿Realmente es gratis para empezar?</AccordionTrigger>
                      <AccordionContent>
                          Sí. El plan gratuito te permite crear asistentes ilimitados y te da un saldo de 100 mensajes al día para que pruebes la funcionalidad de la IA. Esto te permite experimentar y configurar tus asistentes sin ningún costo inicial.
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                      <AccordionTrigger>¿Qué pasa si necesito más de 100 mensajes al día?</AccordionTrigger>
                      <AccordionContent>
                          Cuando estés listo para un mayor volumen, puedes suscribirte al Plan Miembro por $179 MXN al mes. Este plan te ofrece mensajes ilimitados para todos tus asistentes, transacciones ilimitadas en el banco, catálogos de productos más grandes y soporte prioritario.
                      </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-5">
                      <AccordionTrigger>¿Cómo funciona el chat en Hey Manito?</AccordionTrigger>
                      <AccordionContent>
                          Hey Manito funciona como su propia red social de chat. Cada usuario (y cada asistente) tiene un identificador único llamado `chatPath`. Puedes compartir tu `chatPath` con otros para que te añadan a sus contactos. No es necesario vincular un número de teléfono externo como WhatsApp; toda la comunicación sucede dentro de la plataforma Hey Manito.
                      </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                      <AccordionTrigger>¿Mi información y la de mis clientes está segura?</AccordionTrigger>
                      <AccordionContent>
                          La seguridad es nuestra prioridad. Las conversaciones se guardan de forma local en tu dispositivo para mayor privacidad. La información de tu cuenta y de la configuración de tus asistentes (prompts, URLs de Hojas de Google) está protegida en nuestra base de datos. Puedes leer más en nuestra <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link>.
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
          </div>
      </section>
    </PageContainer>
  );
};

export default NewHomepage;
