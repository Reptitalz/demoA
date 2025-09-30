
"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FaGoogle, FaDatabase, FaStar, FaPaperclip, FaSpinner } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MakePage = () => {
    const { dispatch } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [sheetUrl, setSheetUrl] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showSheetInput, setShowSheetInput] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        toast({ title: 'Procesando Archivo...', description: 'Creando una Hoja de Google con tus datos. Esto puede tardar un momento.' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileContent = e.target?.result as string;
            try {
                const response = await fetch('/api/sheets/create-from-upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName: file.name, fileContent }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message);

                setSheetUrl(result.sheetUrl);
                setShowSheetInput(true); // Show the input with the new URL
                toast({ title: '¡Éxito!', description: 'Tu archivo ha sido convertido a una Hoja de Google.' });
            } catch (error: any) {
                toast({ title: 'Error de Importación', description: error.message, variant: 'destructive' });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleMenuSelect = (option: 'google' | 'file') => {
      if (option === 'google') {
        setShowSheetInput(true);
      }
      if (option === 'file') {
        fileInputRef.current?.click();
      }
    };

    return (
        <PageContainer>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center px-4 animate-fadeIn">
                
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
                    <span className="text-foreground">Crea tu Asistente con </span>
                    <span className="text-brand-gradient">IA</span>
                </h1>

                <p className="mt-2 max-w-lg mx-auto text-muted-foreground">
                    Describe en lenguaje natural cómo quieres que sea tu asistente. Nuestra IA se encargará del resto.
                </p>

                <Card className="w-full max-w-xl mt-8">
                    <CardContent className="p-6 space-y-4">
                        <Textarea
                            placeholder="Ej: 'Quiero un asistente para mi pizzería llamado 'Tony'. Debe ser amigable, tomar pedidos de pizza, y responder preguntas sobre el menú...'"
                            className="min-h-[120px] text-sm"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        
                        {showSheetInput && (
                            <div className="relative animate-fadeIn">
                                <FaGoogle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    type="url"
                                    placeholder="URL de Google Sheet (Opcional)"
                                    value={sheetUrl}
                                    onChange={(e) => setSheetUrl(e.target.value)}
                                    className="h-12 text-sm pl-10"
                                />
                            </div>
                        )}
                        
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-end gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" title="Adjuntar base de datos" disabled={isUploading}>
                                            {isUploading ? <FaSpinner className="animate-spin" /> : <FaPaperclip />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleMenuSelect('google')}>
                                            <FaGoogle className="mr-2" /> Vincular Hoja de Google
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleMenuSelect('file')}>
                                            <FaDatabase className="mr-2" />
                                            Importar Archivo (.csv)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                
                                <Button 
                                    size="lg" 
                                    className={cn(
                                        "w-full sm:w-auto text-base font-semibold",
                                        "bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border"
                                    )}
                                    onClick={handleCreateAssistant}
                                    disabled={isCreating || isUploading}
                                >
                                    {isCreating ? 'Generando...' : <><FaStar className="mr-2 w-5 h-5"/> Crear Asistente</>}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default MakePage;
