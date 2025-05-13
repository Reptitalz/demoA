
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaRobot, FaCog, FaBolt, FaCommentDots, FaPhoneAlt, FaDatabase, FaEye, FaRoute, FaWhatsapp, FaShareAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { assistantPurposesConfig } from "@/config/appConfig";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AssistantNodeViewDialog from "./AssistantNodeViewDialog";
import { useToast } from "@/hooks/use-toast";

interface AssistantCardProps {
  assistant: AssistantConfig;
  onReconfigure: (assistantId: string) => void;
  animationDelay?: string;
}

const INITIAL_PURPOSES_TO_SHOW = 2;

const AssistantCard = ({ assistant, onReconfigure, animationDelay = "0s" }: AssistantCardProps) => {
  const [isAdvancedView, setIsAdvancedView] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);
  const [showAllPurposes, setShowAllPurposes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setClientMounted(true); 
  }, []);

  const cleanedPhoneNumberForWhatsApp = assistant.phoneLinked ? assistant.phoneLinked.replace(/\D/g, '') : '';
  const whatsappUrl = `https://wa.me/${cleanedPhoneNumberForWhatsApp}`;

  const handleReconfigureClick = () => {
    if (isAdvancedView) {
      setIsAdvancedModalOpen(true);
    } else {
      onReconfigure(assistant.id);
    }
  };

  const handleShareOnWhatsApp = async () => {
    if (!cleanedPhoneNumberForWhatsApp) {
        toast({ title: "Error", description: "Número de WhatsApp no disponible para este asistente.", variant: "destructive"});
        return;
    }

    const shareData = {
      title: `Chatea con ${assistant.name}`,
      text: `Inicia una conversación con ${assistant.name} en WhatsApp.`,
      url: whatsappUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Compartido Exitosamente", description: "El enlace de WhatsApp ha sido compartido." });
      } else {
        throw new Error("navigator.share no está disponible"); 
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(whatsappUrl);
        toast({ title: "Enlace Copiado", description: "Enlace de WhatsApp copiado al portapapeles." });
      } catch (copyError) {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" });
      }
    }
  };


  const allPurposes = Array.from(assistant.purposes).map(pid => 
    assistantPurposesConfig.find(p => p.id === pid)
  ).filter(p => p);

  const displayedPurposes = showAllPurposes ? allPurposes : allPurposes.slice(0, INITIAL_PURPOSES_TO_SHOW);


  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fadeIn" style={{animationDelay}}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaRobot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-lg sm:text-xl">{assistant.name}</CardTitle>
            </div>
            <Badge variant={assistant.phoneLinked ? "default" : "secondary"} className={cn(assistant.phoneLinked && "bg-green-600 text-white", "text-xs px-1.5 py-0.5 sm:px-2 sm:py-1")}>
              {assistant.phoneLinked ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {assistant.phoneLinked && (
            <CardDescription className="flex items-center justify-between text-xs sm:text-sm pt-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <FaPhoneAlt size={12} className="text-muted-foreground" /> {assistant.phoneLinked}
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105 ml-2 px-2.5 py-1.5 rounded-lg shadow-md text-xs"
                aria-label="Iniciar chat de WhatsApp"
                title="Iniciar chat de WhatsApp"
              >
                <FaWhatsapp size={14} />
                <span>Chatear</span>
              </a>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2.5 sm:space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1 sm:mb-1.5">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1 sm:gap-1.5">
                <FaBolt size={14} className="text-accent" /> Propósitos:
              </h4>
              {allPurposes.length > INITIAL_PURPOSES_TO_SHOW && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setShowAllPurposes(!showAllPurposes)}
                  className="text-xs p-0 h-auto text-accent hover:text-accent/80"
                >
                  {showAllPurposes ? "Ver menos" : "Ver más"}
                  {showAllPurposes ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {displayedPurposes.length > 0 ? displayedPurposes.map(purpose => {
                if (!purpose) return null;
                const Icon = purpose.icon || FaCommentDots;
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
                <FaDatabase size={14} className="text-accent" /> Base de Datos Vinculada:
              </h4>
              <Badge variant="outline" className="text-xs py-0.5 px-1.5 sm:py-1 sm:px-2">{assistant.databaseId.substring(0,15)}...</Badge> 
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t pt-3 sm:pt-4">
          {clientMounted ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2 self-center sm:self-auto">
                  <Switch
                      id={`advanced-view-${assistant.id}`}
                      checked={isAdvancedView}
                      onCheckedChange={setIsAdvancedView}
                      aria-label="Alternar vista de nodo avanzada"
                      className="h-4 w-8 sm:h-5 sm:w-10 data-[state=checked]:sm:translate-x-5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" 
                  />
                  <Label htmlFor={`advanced-view-${assistant.id}`} className="text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 cursor-pointer">
                      {isAdvancedView ? <FaRoute size={12}/> : <FaEye size={12}/>}
                      {isAdvancedView ? "Vista de Nodos" : "Vista Básica"}
                  </Label>
              </div>
          ): ( <div className="h-5 w-24 sm:h-6 sm:w-28 bg-muted rounded-md animate-pulse self-center sm:self-auto" /> /* Placeholder for switch */)}
          
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReconfigureClick} 
              className="transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5"
            >
              <FaCog size={14} className="mr-1.5 sm:mr-2" />
              Reconfigurar
            </Button>
            {assistant.phoneLinked && (
              <Button
                size="sm"
                onClick={handleShareOnWhatsApp}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5"
              >
                <FaShareAlt size={14} className="mr-1.5 sm:mr-2" />
                Compartir por WhatsApp
              </Button>
            )}
          </div>
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

