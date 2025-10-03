
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


const PhoneMockup = () => {
    const [messages, setMessages] = React.useState<typeof conversation>([]);
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
    <div className="w-[280px] h-[580px] bg-slate-900 rounded-[40px] border-[10px] border-slate-800 shadow-2xl overflow-hidden relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-xl z-20" />

      {/* Screen */}
      <div className="absolute inset-2 bg-background rounded-[30px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 p-3 bg-card/80 backdrop-blur-sm border-b z-10 flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/heymanito.svg" alt="Bot Avatar" />
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
                    msg && <ChatBubble key={i} from={msg.from as 'user' | 'bot'} text={msg.text} isTyping={!!msg.isTyping} />
                ))}
            </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-2 bg-card/80 backdrop-blur-sm border-t z-10 flex items-center gap-2">
            <div className="flex-grow bg-muted rounded-full h-8 flex items-center px-3">
              <p className="text-sm text-muted-foreground">{typingText}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <FaPaperPlane className="text-primary-foreground h-4 w-4" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
