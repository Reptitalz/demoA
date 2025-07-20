
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaCog, FaBolt, FaCommentDots, FaPhoneAlt, FaDatabase, FaWhatsapp, FaShareAlt, FaChevronDown, FaChevronUp, FaSpinner, FaKey, FaInfoCircle } from "react-icons/fa";
import { assistantPurposesConfig, DEFAULT_ASSISTANT_IMAGE_URL, DEFAULT_ASSISTANT_IMAGE_HINT } from "@/config/appConfig";
import { useState } from 'react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import PhoneNumberSetupDialog from './PhoneNumberSetupDialog';
import BusinessInfoDialog from './BusinessInfoDialog';

interface AssistantCardProps {
  assistant: AssistantConfig;
  onReconfigure: (assistantId: string) => void;
  animationDelay?: string;
}

const INITIAL_PURPOSES_TO_SHOW = 2;

const AssistantCard = ({ 
  assistant, 
  onReconfigure, 
  animationDelay = "0s",
}: AssistantCardProps) => {
  const [showAllPurposes, setShowAllPurposes] = useState(false);
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [isBusinessInfoDialogOpen, setIsBusinessInfoDialogOpen] = useState(false);

  const cleanedPhoneNumberForWhatsApp = assistant.phoneLinked ? assistant.phoneLinked.replace(/\D/g, '') : '';
  const whatsappUrl = `https://wa.me/${cleanedPhoneNumberForWhatsApp}`;

  const handleReconfigureClick = () => {
    onReconfigure(assistant.id);
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

  const currentImageUrl = imageError ? DEFAULT_ASSISTANT_IMAGE_URL : (assistant.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL);
  const currentImageHint = imageError ? DEFAULT_ASSISTANT_IMAGE_HINT : (assistant.imageUrl ? assistant.name : DEFAULT_ASSISTANT_IMAGE_HINT);

  const isAssistantActive = !!assistant.phoneLinked && assistant.numberReady === true;
  const isActivationPending = !!assistant.phoneLinked && assistant.numberReady === false;
  
  let badgeText = "Inactivo";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

  if (isAssistantActive) {
      badgeText = "Activo";
      badgeVariant = "default";
  } else if (isActivationPending) {
      badgeText = "Activando";
      badgeVariant = "outline";
  }
    
  const statusBadge = (
    <Badge variant={badgeVariant} className={cn(
      "absolute top-4 right-4 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1",
      isAssistantActive && "bg-brand-gradient text-primary-foreground",
      isActivationPending && "border-orange-400 text-orange-500 dark:border-orange-500 dark:text-orange-400"
    )}>
      {isActivationPending && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
      {badgeText}
    </Badge>
  );

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fadeIn relative" style={{animationDelay}}>
        {statusBadge}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden border border-border shadow-sm shrink-0">
                <Image
                  src={currentImageUrl}
                  alt={assistant.name || "Avatar del Asistente"}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  onError={() => setImageError(true)}
                  data-ai-hint={currentImageHint}
                />
              </div>
              <div className="flex-grow">
                <CardTitle className="text-lg sm:text-xl">{assistant.name}</CardTitle>
                {isAssistantActive ? (
                    <CardDescription className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                          <FaPhoneAlt size={12} className="text-muted-foreground" /> {assistant.phoneLinked}
                      </div>
                      <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                          "flex items-center gap-1.5 text-primary-foreground hover:opacity-90",
                          "transition-all transform hover:scale-105 ml-2 px-2.5 py-1.5 rounded-lg shadow-md text-xs",
                          "bg-brand-gradient"
                          )}
                          aria-label="Iniciar chat de WhatsApp"
                          title="Iniciar chat de WhatsApp"
                      >
                          <FaWhatsapp size={14} />
                          <span>Chatear</span>
                      </a>
                    </CardDescription>
                ) : isActivationPending ? (
                   <CardDescription className="flex items-center gap-2 text-xs sm:text-sm pt-1 text-muted-foreground">
                    <FaSpinner className="animate-spin h-4 w-4 text-primary" />
                    <span>Activación en proceso, por favor espere...</span>
                  </CardDescription>
                ) : (
                  <CardDescription className="flex items-center gap-2 text-xs sm:text-sm pt-1 text-muted-foreground">
                    <FaPhoneAlt size={12} className="text-muted-foreground" />
                    <span>Esperando número de teléfono para activar.</span>
                  </CardDescription>
                )}
              </div>
            </div>

          </div>
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
                    <Icon size={12} className="text-accent" />
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
        <CardFooter className="flex flex-col items-stretch gap-2 border-t pt-3 sm:pt-4">
            {isAssistantActive ? (
              <>
                <Button
                    size="sm"
                    onClick={() => setIsBusinessInfoDialogOpen(true)}
                    variant="secondary"
                    className="transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5"
                >
                    <FaInfoCircle size={14} className="mr-1.5 sm:mr-2" />
                    Editar Información de Negocio
                </Button>
                <Button
                  size="sm"
                  onClick={handleShareOnWhatsApp}
                  className={cn(
                    "text-primary-foreground transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5 hover:opacity-90",
                    "bg-brand-gradient"
                  )}
                >
                  <FaShareAlt size={14} className="mr-1.5 sm:mr-2" />
                  Compartir por WhatsApp
                </Button>
              </>
            ) : isActivationPending ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsSetupDialogOpen(true)}
                className="transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5"
              >
                <FaKey size={13} className="mr-1.5 sm:mr-2" />
                Reenviar Código
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsSetupDialogOpen(true)}
                className={cn(
                  "text-primary-foreground transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5 hover:opacity-90",
                  "bg-brand-gradient"
                )}
              >
                <FaPhoneAlt size={13} className="mr-1.5 sm:mr-2" />
                Integrar número de teléfono
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconfigureClick}
              className="transition-transform transform hover:scale-105 w-full text-xs px-2 py-1 sm:px-3 sm:py-1.5"
            >
              <FaCog size={14} className="mr-1.5 sm:mr-2" />
              Reconfigurar
            </Button>
        </CardFooter>
      </Card>
      <PhoneNumberSetupDialog
        isOpen={isSetupDialogOpen}
        onOpenChange={setIsSetupDialogOpen}
        assistantId={assistant.id}
        assistantName={assistant.name}
      />
      <BusinessInfoDialog
        isOpen={isBusinessInfoDialogOpen}
        onOpenChange={setIsBusinessInfoDialogOpen}
        assistant={assistant}
      />
    </>
  );
};

export default AssistantCard;
