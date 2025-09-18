
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center px-4 animate-fadeIn space-y-8">
                
                <Card className="w-full max-w-xl text-center preserve-3d chroma-card">
                   <div className="chroma-card-glow" />
                   <CardContent className="p-6">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                            <span className="text-foreground">Crea tu Asistente con </span>
                            <span className="text-brand-gradient animate-text-glow">IA</span>
                        </h1>
                        <p className="mt-2 max-w-lg mx-auto text-muted-foreground">
                            Describe en lenguaje natural cómo quieres que sea tu asistente y nuestra IA se encargará del resto.
                        </p>
                   </CardContent>
                </Card>

                <div className="w-full max-w-xl grid grid-cols-1 gap-6">
                    <Card className="w-full preserve-3d chroma-card">
                        <div className="chroma-card-glow" />
                        <CardHeader className="flex-row items-center gap-4">
                             <div className="p-3 bg-primary/10 border border-primary/20 rounded-full">
                                <Wand2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Tu Idea</CardTitle>
                                <CardDescription>Describe el asistente que necesitas.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Ej: 'Quiero un asistente para mi pizzería llamado 'Tony'. Debe ser amigable, tomar pedidos de pizza, y responder preguntas sobre el menú...'"
                                className="min-h-[140px] text-sm"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="w-full preserve-3d chroma-card">
                       <div className="chroma-card-glow" />
                       <CardHeader className="flex-row items-center gap-4">
                             <div className="p-3 bg-primary/10 border border-primary/20 rounded-full">
                                <FaGoogle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Base de Conocimiento (Opcional)</CardTitle>
                                <CardDescription>Pega la URL de una Hoja de Google.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Input
                               type="url"
                               placeholder="https://docs.google.com/spreadsheets/d/..."
                               value={sheetUrl}
                               onChange={(e) => setSheetUrl(e.target.value)}
                               className="h-12 text-sm"
                             />
                        </CardContent>
                    </Card>
                </div>
                
                <Button 
                    size="lg" 
                    className={cn(
                        "w-full max-w-xl text-base font-semibold shiny-border",
                        "bg-brand-gradient text-primary-foreground hover:opacity-90"
                    )}
                    onClick={handleCreateAssistant}
                    disabled={isCreating}
                >
                    {isCreating ? 'Generando...' : <><Wand2 className="mr-2 w-5 h-5"/> Crear Asistente</>}
                </Button>
            </div>
        </PageContainer>
    );
};

export default MakePage;
