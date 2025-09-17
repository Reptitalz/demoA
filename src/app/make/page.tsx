
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FaBrain, FaShareAlt, FaGoogle } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

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

        // Reset wizard and populate with data from this page
        dispatch({ type: 'RESET_WIZARD' });
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: 'desktop' }); // Explicitly set as desktop
        dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: 'Mi Asistente (Generado)' }); // Placeholder name
        dispatch({ type: 'UPDATE_ASSISTANT_PROMPT', payload: prompt });
        
        if (sheetUrl.trim()) {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: 'import_spreadsheet' });
            dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: 'google_sheets', accessUrl: sheetUrl } });
        }

        // Navigate to the try page
        router.push('/try');
    };

    return (
        <PageContainer>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center px-4 animate-fadeIn">
                <Wand2 size={40} className="text-brand-gradient mb-3" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                    Crea tu Asistente con un <span className="text-brand-gradient">Prompt</span>
                </h1>
                <p className="mt-3 max-w-xl mx-auto text-base text-muted-foreground">
                    Describe en lenguaje natural cómo quieres que sea tu asistente. Nuestra IA se encargará del resto.
                </p>

                <div className="w-full max-w-xl mt-8 text-left space-y-6">
                    <div className="space-y-2">
                        <Label className="text-lg font-semibold flex items-center gap-2">
                           <FaBrain /> Describe tu Asistente
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Sé lo más detallado posible. Incluye su nombre, objetivo, personalidad y qué información debe manejar.
                        </p>
                        <div className="relative p-0.5 rounded-lg transition-all bg-brand-gradient">
                            <Textarea
                                placeholder="Ej: 'Quiero un asistente para mi pizzería llamado 'Tony'. Debe ser amigable, tomar pedidos de pizza, y responder preguntas sobre el menú...'"
                                className="min-h-[120px] text-sm"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="font-medium flex items-center gap-2">
                         <FaGoogle className="text-blue-500" /> URL de Google Sheet (Opcional)
                       </Label>
                       <Input
                         type="url"
                         placeholder="Pega la URL de una Hoja de Google para darle conocimiento"
                         value={sheetUrl}
                         onChange={(e) => setSheetUrl(e.target.value)}
                         className="h-9 text-sm"
                       />
                    </div>

                    <Button 
                        size="lg" 
                        className={cn(
                            "w-full text-base",
                            "bg-brand-gradient text-primary-foreground hover:opacity-90"
                        )}
                        onClick={handleCreateAssistant}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Generando...' : 'Crear Asistente'}
                    </Button>
                </div>
            </div>
        </PageContainer>
    );
};

export default MakePage;
