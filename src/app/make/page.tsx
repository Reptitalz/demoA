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
import { Card, CardContent } from '@/components/ui/card';

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
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center px-4 animate-fadeIn">
                
                <h1 className="text-5xl sm:text-6xl font-extrabold text-brand-gradient mb-4 tracking-tight animate-text-glow">
                    Crea tu Asistente con IA
                </h1>

                <p className="mt-2 max-w-xl mx-auto text-lg text-muted-foreground">
                    Describe en lenguaje natural cómo quieres que sea tu asistente. Nuestra IA se encargará del resto.
                </p>

                <Card className="w-full max-w-xl mt-10 shadow-lg">
                   <CardContent className="p-6 space-y-4">
                    <Textarea
                        placeholder="Ej: 'Quiero un asistente para mi pizzería llamado 'Tony'. Debe ser amigable, tomar pedidos de pizza, y responder preguntas sobre el menú...'"
                        className="min-h-[120px] text-sm"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />

                    <div className="relative">
                         <FaGoogle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                           type="url"
                           placeholder="URL de Google Sheet (Opcional)"
                           value={sheetUrl}
                           onChange={(e) => setSheetUrl(e.target.value)}
                           className="h-12 text-sm pl-10"
                         />
                    </div>

                    <Button 
                        size="lg" 
                        className={cn(
                            "w-full text-base font-semibold",
                            "bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border"
                        )}
                        onClick={handleCreateAssistant}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Generando...' : <><Wand2 className="mr-2 w-5 h-5"/> Crear Asistente</>}
                    </Button>
                   </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default MakePage;
