
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaTrash, FaPlus, FaLightbulb } from 'react-icons/fa';
import type { DatabaseConfig, KnowledgeItem } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { formatBytes } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface KnowledgeManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseConfig;
}

const KnowledgeManagementDialog = ({ isOpen, onOpenChange, database }: KnowledgeManagementDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [newKnowledge, setNewKnowledge] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/knowledge?databaseId=${database.id}&userId=${userProfile._id}`)
        .then(res => res.json())
        .then((data: KnowledgeItem[] | { message: string }) => {
          if (Array.isArray(data)) {
            setItems(data);
          } else {
            throw new Error(data.message || 'Error al cargar el conocimiento.');
          }
        })
        .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, database.id, userProfile._id, toast]);

  const handleAddItem = async () => {
    if (!newKnowledge.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseId: database.id, content: newKnowledge, userId: userProfile._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setItems(prev => [data, ...prev]);
      dispatch({ type: 'UPDATE_DATABASE', payload: { ...database, storageSize: (database.storageSize || 0) + data.size } });
      setNewKnowledge('');
      toast({ title: 'Éxito', description: 'Elemento de conocimiento añadido.' });

    } catch (err: any) {
      toast({ title: 'Error al Añadir', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItemToDelete(itemId);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, userId: userProfile._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const deletedItem = items.find(item => item._id.toString() === itemId);
      setItems(prev => prev.filter(item => item._id.toString() !== itemId));
      if (deletedItem) {
        dispatch({ type: 'UPDATE_DATABASE', payload: { ...database, storageSize: (database.storageSize || 0) - deletedItem.size } });
      }
      toast({ title: 'Éxito', description: 'Elemento de conocimiento eliminado.' });

    } catch (err: any) {
      toast({ title: 'Error al Eliminar', description: err.message, variant: 'destructive' });
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" onInteractOutside={e => { if (isSaving) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaLightbulb /> Gestionar Conocimiento de "{database.name}"
          </DialogTitle>
          <DialogDescription>
            Añade, edita o elimina la información que tu asistente utilizará para responder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
            <Textarea
                placeholder="Escribe aquí una nueva pieza de conocimiento para tu asistente... (Ej: 'Nuestros horarios de atención son de 9am a 6pm de lunes a viernes.')"
                value={newKnowledge}
                onChange={e => setNewKnowledge(e.target.value)}
                rows={4}
                disabled={isSaving}
                className="text-sm"
            />
            <Button onClick={handleAddItem} disabled={isSaving || !newKnowledge.trim()} className="w-full">
                {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaPlus className="mr-2" />}
                Añadir Conocimiento
            </Button>
        </div>

        <ScrollArea className="flex-grow border rounded-md">
            <div className="p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">Aún no hay conocimiento añadido.</p>
                ) : (
                    <div className="space-y-3">
                    {items.map(item => (
                        <div key={item._id.toString()} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-grow">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {formatBytes(item.size)} - {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item._id.toString())} disabled={itemToDelete === item._id.toString()} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                {itemToDelete === item._id.toString() ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                            </Button>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeManagementDialog;
