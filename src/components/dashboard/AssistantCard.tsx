
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaCog, FaBolt, FaCommentDots, FaShareAlt, FaChevronDown, FaChevronUp, FaSpinner, FaCrown, FaStar, FaEllipsisV, FaRegCommentDots, FaDesktop } from "react-icons/fa";
import { assistantPurposesConfig, DEFAULT_ASSISTANT_IMAGE_URL, DEFAULT_ASSISTANT_IMAGE_HINT, MONTHLY_PLAN_CREDIT_COST, UNLIMITED_MESSAGES_LIMIT } from "@/config/appConfig";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import BusinessInfoDialog from './BusinessInfoDialog';
import { useApp } from "@/providers/AppProvider";
import ApiInfoDialog from './ApiInfoDialog';
import { Progress } from "../ui/progress";
import Link from "next/link";
import { differenceInDays } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const { dispatch } = useApp();
  const { toast } = useToast();
  
  const [showAllPurposes, setShowAllPurposes] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isBusinessInfoDialogOpen, setIsBusinessInfoDialogOpen] = useState(false);
  const [isApiInfoDialogOpen, setIsApiInfoDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);


  const desktopChatUrl = assistant.chatPath ? `/chat/${assistant.chatPath}` : `/chat/not-found`;
  const shareUrl = desktopChatUrl;


  const handleReconfigureClick = () => {
    onReconfigure(assistant.id);
  };

  const handleShare = async () => {
    if (!assistant.isActive) {
        toast({ title: "Error", description: "El asistente debe estar activo para compartirlo.", variant: "destructive"});
        return;
    }
    
    const shareData = {
      title: `Chatea con ${assistant.name}`,
      text: `Inicia una conversación con ${assistant.name}.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Compartido Exitosamente", description: "El enlace de chat ha sido compartido." });
      } else {
        throw new Error("navigator.share no está disponible");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Enlace Copiado", description: "Enlace de chat copiado al portapapeles." });
      } catch (copyError) {
        toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" });
      }
    }
  };

  const allPurposes = assistant.purposes.map(pid =>
    assistantPurposesConfig.find(p => p.id === pid.split(' ')[0])
  ).filter(p => p);

  const displayedPurposes = showAllPurposes ? allPurposes : allPurposes.slice(0, INITIAL_PURPOSES_TO_SHOW);

  const currentImageUrl = imageError ? DEFAULT_ASSISTANT_IMAGE_URL : (assistant.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL);
  const currentImageHint = imageError ? DEFAULT_ASSISTANT_IMAGE_HINT : (assistant.imageUrl ? assistant.name : DEFAULT_ASSISTANT_IMAGE_HINT);

  // Trial logic
  const trialDaysRemaining = assistant.trialStartDate ? 30 - differenceInDays(new Date(), new Date(assistant.trialStartDate)) : 0;
  const isTrialActive = assistant.type === 'desktop' && !!assistant.isFirstDesktopAssistant && trialDaysRemaining > 0;
  const isTrialExpired = assistant.type === 'desktop' && !!assistant.isFirstDesktopAssistant && trialDaysRemaining <= 0;

  // Status logic refined
  let badgeText = "Inactivo";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  
  if (isTrialExpired && !assistant.isPlanActive) {
      badgeText = "Prueba Finalizada";
      badgeVariant = "destructive";
  } else if (isTrialActive) {
      badgeText = "Prueba Gratuita";
      badgeVariant = "default";
  } else if (assistant.isActive || assistant.isPlanActive) {
      badgeText = "Activo";
      badgeVariant = "default";
  }
    
  const statusBadge = (
    <Badge variant={badgeVariant} className={cn(
      "absolute top-4 right-4 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1",
      (badgeText === "Activo" || assistant.isPlanActive) && "bg-brand-gradient text-primary-foreground",
      badgeText === "Prueba Gratuita" && "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
      badgeText === "Activando" && "border-orange-400 text-orange-500 dark:border-orange-500 dark:text-orange-400"
    )}>
      {badgeText === "Prueba Gratuita" && <FaCrown className="mr-1 h-3 w-3" />}
      {assistant.isPlanActive && <FaStar className="mr-1 h-3 w-3" />}
      {assistant.isPlanActive ? "Plan Activo" : badgeText}
    </Badge>
  );
  
  const consumptionPercentage = assistant.monthlyMessageLimit 
    ? Math.min(((assistant.messageCount || 0) / assistant.monthlyMessageLimit) * 100, 100)
    : 0;

  const typeBadge = (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-1 text-xs",
        'border-blue-500 text-blue-600 dark:text-blue-400'
      )}
    >
      <FaDesktop size={12} />
      Desktop
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
                  unoptimized
                />
              </div>
              <div className="flex-grow">
                <CardTitle className="text-lg sm:text-xl">{assistant.name}</CardTitle>
                 <div className="flex items-center gap-2 pt-1">
                  {typeBadge}
                </div>
                <CardDescription className="flex items-center justify-between text-xs sm:text-sm pt-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                      Activo en la web
                  </div>
                </CardDescription>
              </div>
            </div>

          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3.5 sm:space-y-4">
          {isTrialActive || assistant.isPlanActive ? (
             <div className="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 p-2.5 text-sm font-semibold text-gray-800 shadow-md">
              <FaCrown />
              <div>
                <span>Modo Ilimitado</span>
                  {isTrialActive && <span className="block text-xs font-normal opacity-90">Te quedan {trialDaysRemaining} días</span>}
              </div>
            </div>
          ) : !isTrialExpired ? (
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1 sm:gap-1.5">
                <FaRegCommentDots size={14} className="text-accent" /> Consumo Mensual:
              </h4>
              <div className="mt-1.5 space-y-1">
                <Progress value={consumptionPercentage} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{(assistant.messageCount || 0).toLocaleString()}</span>
                  <span>{(assistant.monthlyMessageLimit || 0).toLocaleString()} msjs.</span>
                </div>
              </div>
            </div>
          ) : null}
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
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 border-t pt-3 sm:pt-4">
             <div className="flex items-center gap-2">
               <Button asChild size="sm" className="flex-1 bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border transition-transform transform hover:scale-105">
                   <Link href={desktopChatUrl}>
                       <FaRobot size={14} /> Chatear
                   </Link>
               </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-9 w-9">
                          <FaEllipsisV />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare}>
                          <FaShareAlt className="mr-2"/> Compartir
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
             </div>

              <Button
                  size="sm"
                  onClick={handleReconfigureClick}
                  className={cn(
                      "w-full text-xs transition-transform transform hover:scale-105",
                      "bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border"
                  )}
              >
                  <FaCog size={14} />
                  Configurar
              </Button>
        </CardFooter>
      </Card>
      
      <BusinessInfoDialog
        isOpen={isBusinessInfoDialogOpen}
        onOpenChange={setIsBusinessInfoDialogOpen}
        assistant={assistant}
      />
      <ApiInfoDialog
        isOpen={isApiInfoDialogOpen}
        onOpenChange={setIsApiInfoDialogOpen}
        assistant={assistant}
      />
    </>
  );
};

export default AssistantCard;
