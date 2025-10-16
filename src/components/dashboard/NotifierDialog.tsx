
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FaBell, FaSpinner, FaSearch, FaUser } from 'react-icons/fa';
import type { AssistantConfig, Contact } from '@/types';
import { useApp } from '@/providers/AppProvider';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2 } from 'lucide-react';

interface NotifierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const NotifierDialog = ({ isOpen, onOpenChange, assistant }: NotifierDialogProps) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (isOpen && assistant) {
      setIsLoading(true);
      // Simulate fetching contacts for this assistant
      setTimeout(() => {
        const demoContacts: Contact[] = [
            { _id: '1', name: 'Cliente Leal', chatPath: 'cliente-leal', conversationSize: 1024, destination: '555-111-2222' },
            { _id: '2', name: 'Prospecto Interesado', chatPath: 'prospecto-interesado', conversationSize: 512, destination: '555-333-4444' },
            { _id: '3', name: 'Usuario Nuevo', chatPath: 'usuario-nuevo', conversationSize: 256, destination: '555-555-6666' },
        ];
        setContacts(demoContacts);
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, assistant]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendNotifications = () => {
    if (!message.trim()) {
        toast({ title: 'Mensaje requerido', description: 'Por favor, escribe el mensaje que quieres enviar.', variant: 'destructive'});
        return;
    }
    setIsSending(true);
    toast({ title: 'Enviando Notificaciones...', description: 'Esta función estará disponible próximamente.'});
    setTimeout(() => {
        setIsSending(false);
        onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none sm:max-w-4xl sm:h-auto sm:max-h-[90vh] flex flex-col p-0" onInteractOutside={e => { if (isSending) e.preventDefault(); }}>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FaBell /> Notificador para "{assistant?.name}"
          </DialogTitle>
          <DialogDescription>
            Configura y envía notificaciones a los contactos de tu asistente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 flex-grow min-h-0">
            <div className="p-6 flex flex-col space-y-4">
                <h3 className="font-semibold">Configuración de la Notificación</h3>
                <div className="space-y-2">
                    <Label htmlFor="notification-message">Mensaje a Enviar</Label>
                    <Textarea 
                        id="notification-message"
                        placeholder="Ej: ¡Hola! Tenemos nuevas promociones esta semana. ¡No te las pierdas!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                    />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <Label htmlFor="notification-frequency">Frecuencia</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger id="notification-frequency">
                                <SelectValue placeholder="Frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="once">Una vez</SelectItem>
                                <SelectItem value="daily">Diariamente</SelectItem>
                                <SelectItem value="weekly">Semanalmente</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="notification-time">Hora de Envío</Label>
                        <Input 
                            id="notification-time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                     </div>
                 </div>
                 <Button className="w-full mt-auto bg-brand-gradient text-primary-foreground" onClick={handleSendNotifications} disabled={isSending}>
                    {isSending ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Programar y Enviar Notificaciones
                </Button>
            </div>
            
            <div className="p-6 flex flex-col space-y-3 border-t md:border-t-0 md:border-l">
                <h3 className="font-semibold">Contactos del Asistente ({filteredContacts.length})</h3>
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <ScrollArea className="flex-grow border rounded-md">
                    <div className="p-2">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <p className="text-center text-muted-foreground p-4 text-sm">No se encontraron contactos.</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredContacts.map(contact => (
                                    <div key={contact.chatPath} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={contact.imageUrl} />
                                            <AvatarFallback><FaUser /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="text-sm font-semibold">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground">{contact.destination}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
        
        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotifierDialog;
