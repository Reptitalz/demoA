
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaCog, FaBolt, FaCommentDots, FaPhoneAlt, FaDatabase, FaWhatsapp, FaShareAlt, FaChevronDown, FaChevronUp, FaSpinner, FaKey, FaInfoCircle, FaMobileAlt } from "react-icons/fa";
import { assistantPurposesConfig, DEFAULT_ASSISTANT_IMAGE_URL, DEFAULT_ASSISTANT_IMAGE_HINT, MESSAGES_PER_CREDIT } from "@/config/appConfig";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import BusinessInfoDialog from './BusinessInfoDialog';
import { Input } from "../ui/input";
import { PhoneInput } from "../ui/phone-input";
import { E164Number, isValidPhoneNumber } from "react-phone-number-input";
import { useApp } from "@/providers/AppProvider";
import MessageLimitDialog from './MessageLimitDialog';
import { Progress } from "../ui/progress";
import { MessagesSquare } from "lucide-react";

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
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { toast } = useToast();
  
  const [showAllPurposes, setShowAllPurposes] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isBusinessInfoDialogOpen, setIsBusinessInfoDialogOpen] = useState(false);
  const [isMessageLimitDialogOpen, setIsMessageLimitDialogOpen] = useState(false);

  // Local state for the phone integration flow
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationStep, setIntegrationStep] = useState(1); // 1 for phone, 2 for code
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // If dialog is closed or assistant changes, reset state
    if (!isIntegrating) {
        setIntegrationStep(1);
        setPhoneNumber(undefined);
        setVerificationCode('');
        setIsProcessing(false);
    }
  }, [isIntegrating, assistant.id]);

  const cleanedPhoneNumberForWhatsApp = assistant.phoneLinked ? assistant.phoneLinked.replace(/\D/g, '') : '';
  const whatsappUrl = `https://wa.me/${cleanedPhoneNumberForWhatsApp}`;

  const handleReconfigureClick = () => {
    onReconfigure(assistant.id);
  };
  
  const handleRequestCode = async () => {
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
        toast({ title: "Número Inválido", description: "Por favor, ingresa un número de teléfono válido.", variant: "destructive" });
        return;
    }
    if (!state.userProfile._id) {
        toast({ title: "Error de autenticación", description: "No se pudo identificar al usuario.", variant: "destructive" });
        return;
    }
    setIsProcessing(true);
    
    try {
        const response = await fetch('/api/assistants/link-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                assistantId: assistant.id, 
                phoneNumber: phoneNumber,
                userDbId: state.userProfile._id.toString(),
            })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Error al vincular el número.');
        }
        
        await fetchProfileCallback(state.userProfile.phoneNumber!);

        toast({ title: "Número Registrado", description: `Ingresa el código de verificación que recibirás.`});
        setIntegrationStep(2);
        
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
        toast({ title: "Código Inválido", description: "Por favor, ingresa el código de verificación.", variant: "destructive" });
        return;
    }
    const currentPhoneNumber = phoneNumber || assistant.phoneLinked;
    if (!state.userProfile._id || !currentPhoneNumber) {
        toast({ title: "Error de autenticación", description: "No se pudo identificar al usuario o el número de teléfono.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    
    const processingToast = toast({
        title: "Procesando Activación...",
        description: `Tu asistente se está actualizando. Esto puede tardar un momento.`,
    });
    
     try {
        await fetch('/api/assistants/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                assistantId: assistant.id, 
                phoneNumber: currentPhoneNumber,
                verificationCode: verificationCode,
                userDbId: state.userProfile._id.toString(),
            })
        });
        
        if (state.userProfile.phoneNumber) {
           await fetchProfileCallback(state.userProfile.phoneNumber);
        }
        
        toast({ 
            title: "Estado del Asistente Actualizado", 
            description: `Se ha procesado el código. El estado de tu asistente se reflejará en el panel.`,
            variant: "default"
        });
        
    } catch (error: any) {
        toast({ title: "Error de Activación", description: error.message, variant: "destructive" });
    } finally {
        processingToast.dismiss();
        setIsProcessing(false);
        setIsIntegrating(false);
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

  const currentImageUrl = imageError ? DEFAULT_ASSISTANT_IMAGE_URL : (assistant.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL);
  const currentImageHint = imageError ? DEFAULT_ASSISTANT_IMAGE_HINT : (assistant.imageUrl ? assistant.name : DEFAULT_ASSISTANT_IMAGE_HINT);

  const isAssistantActive = !!assistant.phoneLinked && assistant.numberReady === true;
  const isWaitingForCode = !!assistant.phoneLinked && !assistant.numberReady;
  
  let badgeText = "Inactivo";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

  if (isAssistantActive) {
      badgeText = "Activo";
      badgeVariant = "default";
  } else if (isWaitingForCode) {
      badgeText = "Activando";
      badgeVariant = "outline";
  }
    
  const statusBadge = (
    <Badge variant={badgeVariant} className={cn(
      "absolute top-4 right-4 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1",
      isAssistantActive && "bg-brand-gradient text-primary-foreground",
      isWaitingForCode && "border-orange-400 text-orange-500 dark:border-orange-500 dark:text-orange-400"
    )}>
      {isWaitingForCode && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
      {badgeText}
    </Badge>
  );
  
  const consumptionPercentage = assistant.monthlyMessageLimit 
    ? Math.min(((assistant.messagesSentThisMonth || 0) / assistant.monthlyMessageLimit) * 100, 100)
    : 0;

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
                  unoptimized
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
                ) : isWaitingForCode ? (
                   <CardDescription className="flex items-center gap-2 text-xs sm:text-sm pt-1 text-muted-foreground">
                    <FaSpinner className="animate-spin h-4 w-4 text-primary" />
                    <span>Esperando código para {assistant.phoneLinked}...</span>
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
        <CardContent className="flex-grow space-y-3.5 sm:space-y-4">
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1 sm:gap-1.5">
              <MessagesSquare size={14} className="text-accent" /> Consumo Mensual:
            </h4>
            <div className="mt-1.5 space-y-1">
              <Progress value={consumptionPercentage} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(assistant.messagesSentThisMonth || 0).toLocaleString()}</span>
                <span>{(assistant.monthlyMessageLimit || 0).toLocaleString()} msjs.</span>
              </div>
            </div>
          </div>
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
              <Badge variant="outline" className="text-xs py-0.5 px-1.5 sm:py-1 sm:px-2">{state.userProfile.databases.find(db => db.id === assistant.databaseId)?.name || 'Desconocida'}</Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 border-t pt-3 sm:pt-4">
            {isIntegrating ? (
                <div className="space-y-3 animate-fadeIn p-2">
                    {integrationStep === 1 && (
                        <>
                            <p className="text-xs text-muted-foreground text-center">Usa un chip nuevo que nunca haya tenido WhatsApp.</p>
                             <PhoneInput
                                id={`phone-${assistant.id}`}
                                placeholder="Número de WhatsApp del asistente"
                                value={phoneNumber}
                                onChange={(value) => setPhoneNumber(value)}
                                defaultCountry="MX"
                                disabled={isProcessing}
                                />
                            <Button onClick={handleRequestCode} disabled={isProcessing || !isValidPhoneNumber(phoneNumber || '')} className="w-full">
                                {isProcessing ? <FaSpinner className="animate-spin" /> : <FaMobileAlt />}
                                Solicitar Código
                            </Button>
                        </>
                    )}
                    {integrationStep === 2 && (
                        <>
                            <p className="text-xs text-muted-foreground text-center">Revisa el SMS que enviamos a {phoneNumber || assistant.phoneLinked}.</p>
                            <Input
                                id={`code-${assistant.id}`}
                                placeholder="Código de verificación"
                                value={verificationCode}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    setVerificationCode(value);
                                  }
                                }}
                                disabled={isProcessing}
                            />
                            <Button onClick={handleVerifyCode} disabled={isProcessing || verificationCode.length === 0} className="w-full">
                                 {isProcessing ? <FaSpinner className="animate-spin" /> : <FaKey />}
                                Verificar y Activar
                            </Button>
                        </>
                    )}
                     <Button variant="ghost" size="sm" onClick={() => setIsIntegrating(false)} disabled={isProcessing} className="w-full text-xs h-auto py-1">
                        Cancelar
                    </Button>
                </div>
            ) : (
                <>
                    {isAssistantActive ? (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsBusinessInfoDialogOpen(true)}
                                variant="secondary"
                                className="transition-transform transform hover:scale-105 w-full text-xs"
                            >
                                <FaInfoCircle size={14} />
                                Info. de Negocio
                            </Button>
                             <Button
                                size="sm"
                                onClick={() => setIsMessageLimitDialogOpen(true)}
                                variant="secondary"
                                className="transition-transform transform hover:scale-105 w-full text-xs"
                            >
                                <MessagesSquare size={14} />
                                Asignar Límite
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleShareOnWhatsApp}
                                className="bg-brand-gradient text-primary-foreground hover:opacity-90 w-full text-xs col-span-2"
                            >
                                <FaShareAlt size={14} />
                                Compartir
                            </Button>
                        </div>
                    ) : isWaitingForCode ? (
                        <div className="space-y-3 animate-fadeIn p-2">
                            <p className="text-xs text-muted-foreground text-center">Ingresa el código de verificación para {assistant.phoneLinked}.</p>
                            <Input
                                id={`code-${assistant.id}`}
                                placeholder="Código de verificación"
                                value={verificationCode}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    setVerificationCode(value);
                                  }
                                }}
                                disabled={isProcessing}
                            />
                            <Button onClick={handleVerifyCode} disabled={isProcessing || verificationCode.length === 0} className="w-full">
                                 {isProcessing ? <FaSpinner className="animate-spin" /> : <FaKey />}
                                Verificar y Activar
                            </Button>
                        </div>
                    ) : (
                         <Button
                            size="sm"
                            onClick={() => setIsIntegrating(true)}
                            className="bg-brand-gradient text-primary-foreground hover:opacity-90 w-full text-xs"
                         >
                            <FaPhoneAlt size={13} />
                            Integrar número de teléfono
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReconfigureClick}
                        className="transition-transform transform hover:scale-105 w-full text-xs"
                    >
                        <FaCog size={14} />
                        Reconfigurar
                    </Button>
                </>
            )}
        </CardFooter>
      </Card>
      
      <BusinessInfoDialog
        isOpen={isBusinessInfoDialogOpen}
        onOpenChange={setIsBusinessInfoDialogOpen}
        assistant={assistant}
      />
      <MessageLimitDialog
        isOpen={isMessageLimitDialogOpen}
        onOpenChange={setIsMessageLimitDialogOpen}
        assistant={assistant}
      />
    </>
  );
};

export default AssistantCard;
