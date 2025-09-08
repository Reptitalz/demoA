
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaTrash, FaAddressBook, FaPhone, FaImage } from 'react-icons/fa';
import type { DatabaseConfig, Contact } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatBytes } from '@/lib/utils';
import ContactImagesDialog from './ContactImagesDialog'; // Import the new dialog
import { cn } from '@/lib/utils';


// This is a placeholder type. We'll need a real API for this.
const DEMO_CONTACTS: Contact[] = [
    { _id: '1', name: 'Ana García', phone: '+52 33 1234 5678', conversationSize: 1250, images: [{ _id: 'img1', url: 'https://picsum.photos/seed/cake1/400/300', receivedAt: new Date(), read: false }] },
    { _id: '2', name: 'Carlos Martínez', phone: '+52 55 9876 5432', conversationSize: 5600, images: [{ _id: 'img2', url: 'https://picsum.photos/seed/design2/400/300', receivedAt: new Date(), read: true }, { _id: 'img3', url: 'https://picsum.photos/seed/idea3/400/300', receivedAt: new Date(), read: false }] },
    { _id: '3', name: 'Sofía Rodríguez', phone: '+52 81 1122 3344', conversationSize: 850 },
    { _id: '4', name: 'Javier Hernández', phone: '+52 44 2233 4455', conversationSize: 22400, images: [{ _id: 'img4', url: 'https://picsum.photos/seed/meeting4/400/300', receivedAt: new Date(), read: true }] },
];

interface ContactsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseConfig;
}

const ContactsDialog = ({ isOpen, onOpenChange, database }: ContactsDialogProps) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isImagesDialogOpen, setIsImagesDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate fetching contacts. Replace with actual API call.
      setTimeout(() => {
        setContacts(DEMO_CONTACTS);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, database.id]);

  const handleViewImages = (contact: Contact) => {
    setSelectedContact(contact);
    setIsImagesDialogOpen(true);
    // Mark images as read for this contact
    setContacts(prevContacts => prevContacts.map(c => {
        if (c._id === contact._id && c.images) {
            return {
                ...c,
                images: c.images.map(img => ({ ...img, read: true }))
            };
        }
        return c;
    }));
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none flex flex-col" onInteractOutside={e => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaAddressBook /> Contactos de "{database.name}"
          </DialogTitle>
          <DialogDescription>
            Visualiza los contactos con los que ha interactuado tu asistente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow flex flex-col space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o teléfono..."
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
                        <p className="text-center text-muted-foreground p-4">
                            {searchTerm ? 'No se encontraron contactos.' : 'Aún no hay contactos registrados.'}
                        </p>
                    ) : (
                        <div className="space-y-2">
                        {filteredContacts.map(contact => {
                           const hasUnreadImages = contact.images?.some(img => !img.read);
                           return (
                            <div key={contact._id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><FaPhone size={10}/>{contact.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1.5">Peso de la Conversación</p>
                                    <p className="text-xs font-medium text-foreground">{formatBytes(contact.conversationSize)}</p>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleViewImages(contact)} 
                                    className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 relative"
                                    disabled={!contact.images || contact.images.length === 0}
                                >
                                    <FaImage />
                                    {hasUnreadImages && (
                                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-muted" />
                                    )}
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                    <FaTrash />
                                </Button>
                            </div>
                           )
                        })}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-end w-full pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {selectedContact && (
        <ContactImagesDialog 
            isOpen={isImagesDialogOpen}
            onOpenChange={setIsImagesDialogOpen}
            contact={selectedContact}
        />
    )}
    </>
  );
};

export default ContactsDialog;
