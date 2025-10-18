
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaWhatsapp, FaUser, FaPaperPlane } from 'react-icons/fa';
import AppIcon from '../shared/AppIcon';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const Phone = ({ children, className, rotation = 0, animation, style }: { children: React.ReactNode, className?: string, rotation?: number, animation?: any, style?: React.CSSProperties }) => (
    <motion.div
        className={cn("w-[220px] h-[450px] bg-slate-900 rounded-[30px] border-8 border-slate-800 shadow-2xl overflow-hidden absolute md:relative", className)}
        initial={{ y: 50, opacity: 0, rotate: rotation }}
        animate={{ y: 0, opacity: 1, rotate: rotation, ...animation }}
        style={style}
    >
        <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
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

const conversation = [
  { from: 'user', text: 'Hola, me interesa una pizza.' },
  { from: 'bot', text: '¡Claro! Tenemos Peperoni, Hawaiana y Mexicana. ¿Cuál te gustaría?' },
  { from: 'user', text: 'Quiero la de peperoni, por favor.' },
  { from: 'bot', text: 'Excelente elección. El costo es de $150. ¿Deseas confirmar tu pedido ahora?' },
  { from: 'user', text: 'Sí, confirmar.' },
  { from: 'bot', text: 'Escribiendo...', isTyping: true },
  { from: 'bot', text: '¡Perfecto! Tu pedido está en camino. Gracias por preferirnos.' },
];

const ChatBubble = ({ from, text, isTyping }: { from: 'user' | 'bot'; text: string; isTyping?: boolean }) => {
  const isUser = from === 'user';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={cn("flex items-end gap-2 max-w-[80%]", isUser ? 'self-end' : 'self-start')}
    >
      {!isUser && (
        <Avatar className="h-6 w-6">
           <AvatarImage src="/heymanito.svg" alt="Bot Avatar" />
          <AvatarFallback><FaRobot /></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "rounded-2xl px-3 py-2 text-sm shadow-md",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border"
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1 p-1">
            <motion.span className="h-1.5 w-1.5 bg-muted-foreground rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.span className="h-1.5 w-1.5 bg-muted-foreground rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}/>
            <motion.span className="h-1.5 w-1.5 bg-muted-foreground rounded-full" animate={{ y: [-2, 2, -2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}/>
          </div>
        ) : (
          text
        )}
      </div>
       {isUser && (
        <Avatar className="h-6 w-6">
          <AvatarFallback><FaUser /></AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};


const WhatsAppScreen = () => {
    const [messages, setMessages] = React.useState<(typeof conversation[0])[]>([]);
    const [typingText, setTypingText] = React.useState('');
  
    React.useEffect(() => {
      let messageIndex = 0;
      let typingInterval: NodeJS.Timeout;
      let messageInterval: NodeJS.Timeout;

      const typeMessage = (msg: typeof conversation[0]) => {
          if (msg.from !== 'user') return;
          let charIndex = 0;
          typingInterval = setInterval(() => {
              if (charIndex < msg.text.length) {
                  setTypingText(msg.text.substring(0, charIndex + 1));
                  charIndex++;
              } else {
                  clearInterval(typingInterval);
              }
          }, 50); // Typing speed
      }

      const showNextMessage = () => {
        if (messageIndex < conversation.length) {
            const currentMsg = conversation[messageIndex];
            
            if (currentMsg.from === 'user') {
                typeMessage(currentMsg);
                // Wait for typing to finish before showing the message bubble
                setTimeout(() => {
                    setMessages(prev => [...prev, currentMsg]);
                    setTypingText('');
                    messageIndex++;
                    scheduleNext();
                }, 50 * currentMsg.text.length + 500); // 50ms per char + 0.5s pause
            } else {
                 setMessages(prev => [...prev, currentMsg]);
                 messageIndex++;
                 scheduleNext();
            }

        } else {
          // Restart animation after a delay
          setTimeout(() => {
            setMessages([]);
            messageIndex = 0;
            scheduleNext();
          }, 4000);
        }
      };
      
      const scheduleNext = () => {
          const currentMsg = conversation[messageIndex -1];
          const delay = currentMsg?.isTyping ? 1500 : (currentMsg?.text.length || 20) * 40;
          messageInterval = setTimeout(showNextMessage, delay);
      }

      showNextMessage();
  
      return () => {
          clearInterval(typingInterval);
          clearTimeout(messageInterval);
      }
    }, []);

    return (
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
             <div className="flex-grow p-3 flex flex-col gap-3 overflow-y-auto bg-[#E5DDD5] chat-background">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        msg && <ChatBubble key={i} from={msg.from as 'user' | 'bot'} text={msg.text} isTyping={!!msg.isTyping} />
                    ))}
                </AnimatePresence>
            </div>
            <div className="flex-shrink-0 p-2 bg-[#F0F2F5] border-t z-10 flex items-center gap-2">
                <div className="flex-grow bg-white rounded-full h-8 px-3 flex items-center">
                    <p className="text-sm text-muted-foreground">{typingText}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center">
                    <FaPaperPlane className="text-white h-4 w-4" />
                </div>
            </div>
        </>
    );
};

const DualPhoneMockup = () => {
    return (
        <div className="w-full h-full flex justify-center items-center md:gap-4 relative">
             {/* Desktop layout: Side by side */}
            <div className="hidden md:flex justify-center items-center gap-4">
                 <Phone rotation={-5}>
                    <DashboardScreen />
                </Phone>
                <Phone rotation={5}>
                    <WhatsAppScreen />
                </Phone>
            </div>

            {/* Mobile layout: Swapping animation */}
            <div className="md:hidden w-full h-full flex justify-center items-center">
                <Phone 
                    rotation={0}
                    animation={{
                        x: ['0%', '30%', '30%', '0%'],
                        scale: [1, 0.9, 0.9, 1],
                        zIndex: [20, 10, 10, 20],
                        transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' }
                    }}
                >
                    <WhatsAppScreen />
                </Phone>
                <Phone 
                    rotation={0}
                     animation={{
                        x: ['-30%', '0%', '0%', '-30%'],
                        scale: [0.9, 1, 1, 0.9],
                        zIndex: [10, 20, 20, 10],
                        transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' }
                    }}
                >
                    <DashboardScreen />
                </Phone>
            </div>
        </div>
    );
};

export default DualPhoneMockup;


