"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaPhone, FaPhoneSlash } from 'react-icons/fa';

interface IncomingCallDialogProps {
  isOpen: boolean;
  caller: { name: string; imageUrl?: string };
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallDialog = ({ isOpen, caller, onAccept, onReject }: IncomingCallDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center items-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={caller.imageUrl} alt={caller.name} />
            <AvatarFallback className="text-3xl">{caller.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl">{caller.name}</DialogTitle>
          <DialogDescription>
            Llamada entrante...
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center gap-4 pt-4">
          <Button variant="destructive" size="lg" className="rounded-full h-16 w-16" onClick={onReject}>
            <FaPhoneSlash size={24} />
          </Button>
          <Button variant="default" size="lg" className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600" onClick={onAccept}>
            <FaPhone size={24} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
