"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FaGoogle } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

const MakePage = () => {
    const { dispatch } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAssistant = () => {
        if (!prompt.trim()) {
            toast({
                title: 'Prompt Requerido',
                description: 'Por favor, describe el asistente que quieres crear.',
                variant: 'destructive',
            });
            return;
        }

        setIsCreating(true);

        dispatch({ type: 'RESET_WIZARD' });
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: 'desktop' });
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: 'Mi Asistente (Generado)' });
        dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: prompt });

        if (sheetUrl.trim()) {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: 'import_spreadsheet' });
            dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: 'google_sheets', accessUrl: sheetUrl } });
        }

        router.push('/try');
    };

    return (
        <PageContainer>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center px-4 animate-fadeIn bg-gradient-to-b from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f]">
                
                <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00fff7] via-[#ff00ff] to-[#ff8a00] mb-4 tracking-wide drop-shadow-lg">
                    Crea tu Asistente <br/>
                    <span className="text-white/80 text-3xl sm:text-4xl font-light">con <span className="text-[#00fff7]">IA Futurista</span></span>
                </h1>

                <p className="mt-2 max-w-lg mx-auto text-lg text-gray-400/80">
                    Describe tu asistente en el recuadro y nuestra IA lo creará de forma rápida y personalizada.
                </p>

                <div className="w-full max-w-xl mt-10 p-1 rounded-xl bg-gradient-to-r from-[#00fff7]/50 via-[#ff00ff]/40 to-[#ff8a00]/50 shadow-lg animate-gradient-x">
                   <div className="bg-[#121212] p-8 rounded-xl space-y-6 border border-[#00fff7]/30 backdrop-blur-sm">
                    
                    <Textarea
                        placeholder="Ej: 'Asistente para pizzería, amigable, toma pedidos...'"
                        className="min-h-[140px] text-sm bg-[#1c1c1c] border border-[#00fff7]/50 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-[#00fff7] focus:border-transparent transition-all duration-300"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <div className="relative">
                         <FaGoogle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                         <Input
                           type="url"
                           placeholder="URL de Google Sheet (Opcional)"
                           value={sheetUrl}
                           onChange={(e) => setSheetUrl(e.target.value)}
                           className="h-12 text-sm pl-10 bg-[#1c1c1c] border border-[#ff00ff]/50 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-[#ff00ff] focus:border-transparent transition-all duration-300"
                         />
                    </div>

                    <Button 
                        size="lg" 
                        className={cn(
                            "w-full text-base font-semibold flex items-center justify-center gap-2",
                            "bg-gradient-to-r from-[#00fff7] via-[#ff00ff] to-[#ff8a00] text-black shadow-lg hover:scale-105 hover:brightness-110 transition-all duration-300"
                        )}
                        onClick={handleCreateAssistant}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Generando...' : <><Wand2 className="w-5 h-5 animate-pulse"/>Crear Asistente</>}
                    </Button>
                   </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default MakePage;
