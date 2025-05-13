
"use client";
import type { AssistantConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Settings, Zap, MessageCircle, Phone, Database, Eye, Waypoints } from "lucide-react";
import { assistantPurposesConfig } from "@/config/appConfig";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AssistantNodeViewDialog from "./AssistantNodeViewDialog"; // New component for advanced view

interface AssistantCardProps {
  assistant: AssistantConfig;
  onReconfigure: (assistantId: string) => void;
  animationDelay?: string;
}

// Particle SVG icon (kept as is, but consider if a different icon is needed for "Node View")
const ParticleIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block">
    <circle cx="12" cy="12" r="2" className="text-primary fill-current" />
    <circle cx="6" cy="6" r="1.5" className="text-primary fill-current opacity-80" />
    <circle cx="18" cy="6" r="1.5" className="text-primary fill-current opacity-80" />
    <circle cx="6" cy="18" r="1.5" className="text-primary fill-current opacity-80" />
    <circle cx="18" cy="18" r="1.5" className="text-primary fill-current opacity-80" />
    <path d="M12 14V17M12 10V7M14 12H17M10 12H7M14.1213 9.87868L16.2426 7.75736M9.87868 14.1213L7.75736 16.2426M14.1213 14.1213L16.2426 16.2426M9.87868 9.87868L7.75736 7.75736" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-primary opacity-60" />
  </svg>
);


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
      // For basic view, take user to setup wizard (handled by onReconfigure prop)
      onReconfigure(assistant.id);
    }
  };

  const purposes = Array.from(assistant.purposes).map(pid => 
    assistantPurposesConfig.find(p => p.id === pid)
  ).filter(p => p);

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fadeIn" style={{animationDelay}}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl">{assistant.name}</CardTitle>
            </div>
            <Badge variant={assistant.phoneLinked ? "default" : "secondary"} className={cn(assistant.phoneLinked && "bg-green-600 text-white")}>
              {assistant.phoneLinked ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          {assistant.phoneLinked && (
            <CardDescription className="flex items-center gap-1 text-sm pt-1">
              <Phone size={14} className="text-muted-foreground" /> {assistant.phoneLinked}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-1.5 text-foreground flex items-center gap-1.5">
              <Zap size={16} className="text-accent" /> Propósitos:
            </h4>
            <div className="flex flex-wrap gap-2">
              {purposes.length > 0 ? purposes.map(purpose => {
                if (!purpose) return null;
                const Icon = purpose.icon || MessageCircle;
                return (
                  <Badge key={purpose.id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                    <Icon size={14} />
                    {purpose.name}
                  </Badge>
                );
              }) : <p className="text-xs text-muted-foreground">No se han definido propósitos.</p>}
            </div>
          </div>
          {assistant.databaseId && (
            <div>
               <h4 className="text-sm font-semibold mb-1.5 text-foreground flex items-center gap-1.5">
                <Database size={16} className="text-accent" /> Base de Datos Vinculada:
              </h4>
              {/* In real app, fetch DB name from userProfile.databases based on assistant.databaseId */}
              <Badge variant="outline">{assistant.databaseId.substring(0,15)}...</Badge> 
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t pt-4">
          {clientMounted ? (
              <div className="flex items-center space-x-2">
                  <Switch
                      id={`advanced-view-${assistant.id}`}
                      checked={isAdvancedView}
                      onCheckedChange={setIsAdvancedView}
                      aria-label="Alternar vista de nodo avanzada"
                  />
                  <Label htmlFor={`advanced-view-${assistant.id}`} className="text-sm flex items-center gap-1.5 cursor-pointer">
                      {isAdvancedView ? <Waypoints size={14}/> : <Eye size={14}/>}
                      {isAdvancedView ? "Vista de Nodos" : "Vista Básica"}
                  </Label>
              </div>
          ): ( <div className="h-6 w-28 bg-muted rounded-md animate-pulse" /> /* Placeholder for switch */)}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReconfigureClick} 
            className="transition-transform transform hover:scale-105 w-full sm:w-auto"
          >
            <Settings size={16} className="mr-2" />
            Reconfigurar
          </Button>
        </CardFooter>
      </Card>

      {isAdvancedView && assistant && (
        <Dialog open={isAdvancedModalOpen} onOpenChange={setIsAdvancedModalOpen}>
          <DialogContent className="max-w-2xl min-h-[60vh] bg-card flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl">Vista Avanzada de Nodos: {assistant.name}</DialogTitle>
              <DialogDescription>
                Visualiza las funciones y conexiones de tu asistente.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-auto p-2">
              <AssistantNodeViewDialog assistant={assistant} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AssistantCard;
