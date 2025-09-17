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
        <PageContainer fullWidth>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center px-4 animate-fadeIn">
                <Wand2 size={48} className="text-brand-gradient mb-4" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
                    Crea tu Asistente con un <span className="text-brand-gradient">Prompt</span>
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Describe en lenguaje natural cómo quieres que sea tu asistente. Nuestra IA se encargará del resto.
                </p>

                <Card className="w-full max-w-2xl mt-10 text-left animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <FaBrain /> Describe tu Asistente
                        </CardTitle>
                        <CardDescription>
                            Sé lo más detallado posible. Incluye su nombre, objetivo, personalidad y qué información debe manejar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Textarea
                            placeholder="Ej: 'Quiero un asistente para mi pizzería llamado 'Tony'. Debe ser amigable, tomar pedidos de pizza, y responder preguntas sobre el menú. Debe saber los precios de la base de datos.'"
                            className="min-h-[150px] text-base"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />

                        <div>
                           <label className="text-sm font-medium flex items-center gap-2 mb-2">
                             <FaGoogle className="text-blue-500" /> URL de Google Sheet (Opcional)
                           </label>
                           <Input
                             type="url"
                             placeholder="Pega la URL de una Hoja de Google para darle conocimiento"
                             value={sheetUrl}
                             onChange={(e) => setSheetUrl(e.target.value)}
                           />
                        </div>

                        <Button 
                            size="lg" 
                            className={cn(
                                "w-full text-lg",
                                "bg-brand-gradient text-primary-foreground hover:opacity-90",
                                "shiny-border"
                            )}
                            onClick={handleCreateAssistant}
                            disabled={isCreating}
                        >
                            {isCreating ? 'Generando...' : 'Crear Asistente'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default MakePage;
