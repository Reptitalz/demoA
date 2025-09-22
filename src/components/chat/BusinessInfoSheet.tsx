
// src/components/chat/BusinessInfoSheet.tsx
"use client";

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AssistantConfig } from '@/types';
import { Separator } from '@/components/ui/separator';
import { FaBuilding, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe, FaBriefcase } from 'react-icons/fa';

interface BusinessInfoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
};

const BusinessInfoSheet = ({ isOpen, onOpenChange, assistant }: BusinessInfoSheetProps) => {
  const { name, imageUrl, businessInfo } = assistant;
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full max-w-sm">
        <SheetHeader className="text-center mb-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="text-3xl">{name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl">{name}</SheetTitle>
              <SheetDescription>{businessInfo?.vertical || 'Asistente Inteligente'}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="my-6" />

        <div className="space-y-6">
            <InfoItem icon={FaBriefcase} label="Categoría" value={businessInfo?.vertical} />
            <InfoItem icon={FaMapMarkerAlt} label="Dirección" value={businessInfo?.companyAddress} />
            <InfoItem icon={FaEnvelope} label="Email" value={businessInfo?.companyEmail} />
            <InfoItem icon={FaGlobe} label="Página Web" value={businessInfo?.websiteUrl} />
            <InfoItem icon={FaClock} label="Horarios" value={businessInfo?.openingHours} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BusinessInfoSheet;
