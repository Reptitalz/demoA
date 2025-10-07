// src/app/chat/dashboard/page.tsx
"use client";

import React, { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, Contact } from '@/types';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { useRouter } from 'next/navigation';
import { Bot, CheckSquare, Package, DollarSign } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

// --- CHAT ITEM COMPONENT ---
interface ChatItemProps {
  chat: {
    name: string;
    imageUrl?: string;
    lastMessage: string;
    timestamp: string;
    isOnline?: boolean;
  };
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onClick }) => {
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100 cursor-pointer">
        <div className="relative">
            <Avatar className="h-14 w-14">
                <AvatarImage src={chat.imageUrl} alt={`${chat.name}'s profile picture`} />
                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {chat.isOnline && (
                <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-background-light"></span>
            )}
        </div>
        <div className="flex-1">
            <div className="flex justify-between">
                <p className="text-base font-semibold text-gray-900">{chat.name}</p>
                <p className="text-xs text-gray-500">{chat.timestamp}</p>
            </div>
            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
        </div>
    </div>
  );
};


const MemberSectionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
    <div>
        <button onClick={onClick} className="w-full bg-background-light rounded-xl aspect-square flex flex-col items-center justify-center p-2 shadow">
            <Icon className="text-primary text-3xl" />
            <span className="text-xs mt-1 text-gray-900">{label}</span>
        </button>
    </div>
);


export default function ChatListPage() {
  const { data: session } = useSession();
  const { state } = useApp();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const demoChats = [
      { name: 'Sofía', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDperzlDVvIdARSn86A7rhqvZcnXMI9NYHNeoFzQ8t9q1fem3-NFskRse1o1nj9QzxqLDwfafUBJSoPw6fdq7TeFlAw2q3hh4gpm2SLDcEKiYsHV5ujG1z6sIoMLFOsikcX9nAzWk9dX0HaKoN0obJZKSuVXdPDryU1b1T4S3jwjYlTSg7UIxX4ai71lO1084rp1UhK0tALnSiRZYvywErIQ2GjKIgPagBY7OZhi90E8fBofUs_xGhUe7Lw8dZwunzzMqYlS86jmtM', lastMessage: 'Hola, ¿cómo estás?', timestamp: '10:42 AM', isOnline: true },
      { name: 'Carlos', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6KG9vla-IarT-X8XWcfVpnMRxCS4ORiFeaSUhu9R0eVT4D-reSVErw9K167VlHFy4qMyuSBlFCQ5RLHlSGmdoOpNUfdjEIGFssY-zYBzeaA5Dvf1OPjBPw8lYWezILZombwCSlxZ9DioEzzuOsbLXRWylSh8wFXHOfnYcIlPWQAGvuPMCgb1ayHCIXYY2zKWctRbwVk6V55pdZimkfvF2AQ9J6H1SbxRpcgcuJYE-qC8gM8dR8GNcM-2UH73KNAkG2On9S_lA5PA', lastMessage: 'Gracias por la información', timestamp: 'Ayer', isOnline: false },
      { name: 'Familia', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtET4jhiYU4twI4tn6QLVggF-wYwh-vQRS7Q2iI9Y8EPb7Kq46lK5tyWb_jM3EAVYXu9G83kq3JLP65DZ6fIMmEu2w5ELy8gxLu7kp3Vq3b8LR4WRImuvJwn-_Gz9dBZWL-gAhXEu-p3Ez-CnheiMsgGIhurfyGClk95zTrj3NGkP0s2nRSt-1QNSa-OMjtdwYVsW_absfO7bvN73sK8JuZUmnAnsKBdNiVBPYE4bIFPLUXL96phSJsU7PLFoQVvTmX4YKN8dmMEA', lastMessage: 'Nos vemos mañana', timestamp: 'Domingo', isOnline: false },
      { name: 'Amigos', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNdoYM___fJpeyLR6D0hhoUP2Sj8EkLYRDjOtHpGxt1u81Cn2eNLA4Ma1y7M7-EUSjVoAomebLAw9gYkhnTdBC0HtYaauLO3Eku_N0ozFrLV9gKe-G1Al6Fk6Ex6IUOPakJjeqfNO1tw_SwOGJUOB0auZ8w5MMHCf5frcbfNZnpOV1N4ZK5O9nv_am8CqACSc7aFcGRNBtFcHE2mZXUoJXT-JSY0fALk4XD1xa8IpkDOxJhP6CCbLL_uwX3aN4nw_zGR3u6CZaJsM', lastMessage: 'Ok, te llamo luego', timestamp: '23/04/2024', isOnline: false },
  ];
  
  const filteredChats = useMemo(() => {
    return demoChats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col h-screen bg-background-light font-display">
        <header className="bg-background-light sticky top-0 z-10 px-4 pt-4 pb-2">
            <div className="flex items-center justify-between pb-4">
                <AnimatePresence initial={false}>
                    {isSearchOpen ? (
                         <motion.div
                            key="search-input"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '100%' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-grow"
                        >
                            <Input 
                                placeholder="Buscar chats..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full" 
                                autoFocus
                            />
                        </motion.div>
                    ) : (
                        <motion.h1 
                            key="title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-3xl font-bold text-gray-900"
                        >
                            Chats
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button className="text-gray-900 p-2" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                    <FaSearch className="text-2xl" />
                </button>
            </div>
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    <a className="pb-2 text-primary border-b-2 border-primary text-sm font-bold" href="#">Todos</a>
                    <a className="pb-2 text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary text-sm font-bold" href="#">No leídos</a>
                    <a className="pb-2 text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary text-sm font-bold" href="#">Grupos</a>
                </nav>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto">
            <div className="p-4 bg-primary/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined text-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
                        <h2 className="font-bold text-gray-900">Miembro</h2>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                    <MemberSectionButton icon={CheckSquare} label="Autorizaciones" onClick={() => router.push('/chat/admin')} />
                    <MemberSectionButton icon={Bot} label="Bots" onClick={() => router.push('/chat/admin')} />
                    <MemberSectionButton icon={Package} label="Productos" onClick={() => router.push('/chat/admin')} />
                    <MemberSectionButton icon={DollarSign} label="Créditos" onClick={() => router.push('/chat/admin')} />
                </div>
                <div className="mt-4 bg-background-light rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-900">Plan actual: <span className="font-bold">Gratuito</span></p>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {filteredChats.map((chat, index) => (
                    <ChatItem key={index} chat={chat} onClick={() => {}} />
                ))}
            </div>
        </main>
        
        <footer className="p-4 sticky bottom-0">
            <button className="absolute right-6 bottom-6 bg-primary text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-3xl">chat</span>
            </button>
        </footer>
    </div>
  );
};
