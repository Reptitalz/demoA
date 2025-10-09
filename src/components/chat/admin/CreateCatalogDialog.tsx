// src/components/chat/admin/CreateCatalogDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackagePlus, User, Bot } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import type { Catalog } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateCatalogDialog = ({ isOpen, onOpenChange }: CreateCatalogDialogProps) => {
    const { state, dispatch } = useApp();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [promoterType, setPromoterType] = useState<'user' | 'bot'>('user');
    const [promoterId, setPromoterId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if(isOpen) {
            // Reset state on open
            setName('');
            setPromoterType('user');
            setPromoterId(state.userProfile._id?.toString() || '');
        }
    }, [isOpen, state.userProfile._id]);

    useEffect(() => {
        if (promoterType === 'user') {
            setPromoterId(state.userProfile._id?.toString() || '');
        } else {
            setPromoterId(''); // Reset when switching to bot
        }
    }, [promoterType, state.userProfile._id]);


    const handleSave = () => {
        if (!name.trim()) {
            toast({ title: "Nombre requerido", description: "Por favor, asigna un nombre al catálogo.", variant: "destructive" });
            return;
        }
        if (promoterType === 'bot' && !promoterId) {
            toast({ title: "Asistente requerido", description: "Por favor, selecciona un asistente para este catálogo.", variant: "destructive" });
            return;
        }
        
        setIsProcessing(true);

        const newCatalog: Catalog = {
            id: `cat_${Date.now()}`,
            name,
            promoterType,
            promoterId: promoterId,
            products: [],
        };
        
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: {
            catalogs: [...(state.userProfile.catalogs || []), newCatalog]
        }});

        toast({
            title: "Catálogo Creado",
            description: `El catálogo "${name}" ha sido creado exitosamente.`,
        });

        setIsProcessing(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PackagePlus /> Crear Nuevo Catálogo
                    </DialogTitle>
                    <DialogDescription>
                        Organiza tus productos en catálogos y asígnalos a un promotor.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="catalog-name">Nombre del Catálogo</Label>
                        <Input id="catalog-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Productos de Verano" />
                    </div>

                    <div className="space-y-3">
                        <Label>¿Quién promocionará este catálogo?</Label>
                        <RadioGroup value={promoterType} onValueChange={(v) => setPromoterType(v as 'user' | 'bot')} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="user" id="promoter-user" className="sr-only" />
                                <Label htmlFor="promoter-user" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                    <User className="mb-3 h-6 w-6"/>
                                    Tú Mismo
                                </Label>
                            </div>
                             <div>
                                <RadioGroupItem value="bot" id="promoter-bot" className="sr-only" />
                                <Label htmlFor="promoter-bot" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                                    <Bot className="mb-3 h-6 w-6"/>
                                    Un Asistente
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {promoterType === 'bot' && (
                        <div className="space-y-2 animate-fadeIn">
                             <Label htmlFor="assistant-select">Selecciona el Asistente</Label>
                             <Select onValueChange={setPromoterId}>
                                <SelectTrigger id="assistant-select">
                                    <SelectValue placeholder="Elige un asistente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.userProfile.assistants.map(asst => (
                                        <SelectItem key={asst.id} value={asst.id}>
                                            {asst.name}
                                        </SelectItem>
                                    ))}
                                    {state.userProfile.assistants.length === 0 && <SelectItem value="none" disabled>No tienes asistentes</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Catálogo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCatalogDialog;
