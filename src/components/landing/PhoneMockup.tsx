
"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaUser, FaPaperPlane } from 'react-icons/fa';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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


const PhoneMockup = () => {
    const [messages, setMessages] = React.useState(conversation.slice(0, 1));
  
    React.useEffect(() => {
      let index = 1;
      const interval = setInterval(() => {
        if (index < conversation.length) {
          setMessages(prev => [...prev, conversation[index]]);
          index++;
        } else {
          // Restart animation
          setTimeout(() => {
            setMessages(conversation.slice(0, 1));
            index = 1;
          }, 3000);
        }
      }, 2000);
  
      return () => clearInterval(interval);
    }, []);

  return (
    <div className="w-[280px] h-[580px] bg-slate-900 rounded-[40px] border-[10px] border-slate-800 shadow-2xl overflow-hidden relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-xl z-20" />

      {/* Screen */}
      <div className="absolute inset-2 bg-background rounded-[30px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-3 bg-card/80 backdrop-blur-sm border-b z-10 flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback><FaRobot /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Mi Pizzería</p>
              <p className="text-xs text-green-500">en línea</p>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-grow p-3 flex flex-col gap-3 overflow-y-auto">
            <AnimatePresence>
                {messages.map((msg, i) => (
                    msg && <ChatBubble key={i} from={msg.from as 'user' | 'bot'} text={msg.text} isTyping={msg.isTyping} />
                ))}
            </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-2 bg-card/80 backdrop-blur-sm border-t z-10 flex items-center gap-2">
            <div className="flex-grow bg-muted rounded-full h-8"/>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <FaPaperPlane className="text-primary-foreground h-4 w-4 -ml-0.5" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
