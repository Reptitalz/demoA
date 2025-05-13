
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Settings, Zap, MessageCircle, Phone, Database, Eye, Waypoints, MessageSquare } from "lucide-react";
import { assistantPurposesConfig } from "@/config/appConfig";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AssistantNodeViewDialog from "./AssistantNodeViewDialog";

interface AssistantCardProps {
  assistant: AssistantConfig;
  onReconfigure: (assistantId: string) => void;
  animationDelay?: string;
}

const AssistantCard = ({ assistant, onReconfigure, animationDelay = "0s" }: AssistantCardProps) => {
  const [isAdvancedView, setIsAdvancedView] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);

  useEffect(() => {
    setClientMounted(true); 
  }, []);

  const handleReconfigureClick = () => {
    if (isAdvancedView) {
      setIsAdvancedModalOpen(true);
    } else {
      onReconfigure(assistant.id);
    }
  };

  const purposes = Array.from(assistant.purposes).map(pid => 
    assistantPurposesConfig.find(p => p.id === pid)
  ).filter(p => p);

  const cleanedPhoneNumberForWhatsApp = assistant.phoneLinked ? assistant.phoneLinked.replace(/\D/g, '') : '';

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fadeIn" style={{animationDelay}}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-lg sm:text-xl">{assistant.name}</CardTitle>
            </div>
            <Badge variant={assistant.phoneLinked ? "default" : "secondary"} className={cn(assistant.phoneLinked && "bg-green-600 text-white", "text-xs px-1.5 py-0.5 sm:px-2 sm:py-1")}>
              {assistant.phoneLinked ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {assistant.phoneLinked && (
            <CardDescription className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-muted-foreground" /> {assistant.phoneLinked}
              </div>
              <a
                href={`https://wa.me/${cleanedPhoneNumberForWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors ml-2 p-1 rounded-full hover:bg-primary/10"
                aria-label="Iniciar chat de WhatsApp"
                title="Iniciar chat de WhatsApp"
              >
                <MessageSquare size={14} />
              </a>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2.5 sm:space-y-3">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 text-foreground flex items-center gap-1 sm:gap-1.5">
              <Zap size={14} className="text-accent" /> Propósitos:
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {purposes.length > 0 ? purposes.map(purpose => {
                if (!purpose) return null;
                const Icon = purpose.icon || MessageCircle;
                return (
                  <Badge key={purpose.id} variant="secondary" className="flex items-center gap-1 sm:gap-1.5 py-0.5 px-1.5 sm:py-1 sm:px-2.5 text-xs">
                    <Icon size={12} />
                    {purpose.name}
                  </Badge>
                );
              }) : <p className="text-xs text-muted-foreground">No se han definido propósitos.</p>}
            </div>
          </div>
          {assistant.databaseId && (
            <div>
               <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 text-foreground flex items-center gap-1 sm:gap-1.5">
                <Database size={14} className="text-accent" /> Base de Datos Vinculada:
              </h4>
              <Badge variant="outline" className="text-xs py-0.5 px-1.5 sm:py-1 sm:px-2">{assistant.databaseId.substring(0,15)}...</Badge> 
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 border-t pt-3 sm:pt-4">
          {clientMounted ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Switch
                      id={`advanced-view-${assistant.id}`}
                      checked={isAdvancedView}
                      onCheckedChange={setIsAdvancedView}
                      aria-label="Alternar vista de nodo avanzada"
                      className="h-4 w-8 sm:h-5 sm:w-10 data-[state=checked]:sm:translate-x-5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" // smaller switch
                  />
                  <Label htmlFor={`advanced-view-${assistant.id}`} className="text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 cursor-pointer">
                      {isAdvancedView ? <Waypoints size={12}/> : <Eye size={12}/>}
                      {isAdvancedView ? "Vista de Nodos" : "Vista Básica"}
                  </Label>
              </div>
          ): ( <div className="h-5 w-24 sm:h-6 sm:w-28 bg-muted rounded-md animate-pulse" /> /* Placeholder for switch */)}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReconfigureClick} 
            className="transition-transform transform hover:scale-105 w-full sm:w-auto text-xs px-2 py-1 sm:px-3 sm:py-1.5"
          >
            <Settings size={14} className="mr-1.5 sm:mr-2" />
            Reconfigurar
          </Button>
        </CardFooter>
      </Card>

      {isAdvancedView && assistant && (
        <Dialog open={isAdvancedModalOpen} onOpenChange={setIsAdvancedModalOpen}>
          <DialogContent className="max-w-md sm:max-w-xl md:max-w-2xl min-h-[50vh] sm:min-h-[60vh] bg-card flex flex-col p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Vista Avanzada de Nodos: {assistant.name}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Visualiza las funciones y conexiones de tu asistente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-auto p-1 sm:p-2">
              <AssistantNodeViewDialog assistant={assistant} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AssistantCard;
