
"use client";
import type { DatabaseConfig, DatabaseSource } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaDatabase, FaLink, FaExternalLinkAlt, FaTimesCircle, FaGoogle, FaBrain, FaEllipsisV, FaTrash, FaEye, FaExchangeAlt, FaDownload, FaHdd } from "react-icons/fa";
import { useApp } from "@/providers/AppProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ChangeDatabaseTypeDialog from "./ChangeDatabaseTypeDialog";
import { Progress } from "../ui/progress";
import { formatBytes } from "@/lib/utils";

interface DatabaseInfoCardProps {
  database: DatabaseConfig;
  animationDelay?: string;
}

const DatabaseInfoCard = ({ database, animationDelay = "0s" }: DatabaseInfoCardProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isChangeTypeDialogOpen, setIsChangeTypeDialogOpen] = useState(false);
  
  const linkedAssistants = state.userProfile.assistants.filter(a => a.databaseId === database.id).map(a => a.name);

  const getDatabaseIcon = (source: DatabaseSource) => {
    if (source === "google_sheets") return FaGoogle;
    if (source === "smart_db") return FaBrain;
    return FaDatabase;
  };
  const Icon = getDatabaseIcon(database.source);

  const getSourceName = (source: DatabaseConfig['source']) => {
    if (source === 'google_sheets') return 'Hojas de Google';
    if (source === 'smart_db') return 'Base de Datos Inteligente';
    return 'Fuente Desconocida';
  };
  
  const handleDelete = () => {
    dispatch({ type: 'REMOVE_DATABASE', payload: database.id });
    toast({
      title: "Base de Datos Eliminada",
      description: `La base de datos "${database.name}" ha sido eliminada.`,
    });
    setIsDeleteAlertOpen(false);
  };
  
  const handleViewContent = () => {
    if (database.source === 'google_sheets' && database.accessUrl) {
      window.open(database.accessUrl, '_blank');
    } else {
      toast({
        title: "No disponible",
        description: "La vista de contenido solo está disponible para Hojas de Google vinculadas.",
        variant: "default"
      });
    }
  };

  const handleDownload = async () => {
    if (database.source !== 'google_sheets' || !database.accessUrl) {
      toast({ title: "No disponible", description: "La descarga solo está disponible para Hojas de Google." });
      return;
    }
    
    toast({ title: "Preparando descarga...", description: "Esto puede tardar un momento." });

    try {
      const response = await fetch('/api/sheets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: database.accessUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo descargar el archivo.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${database.name.replace(/\s+/g, '_') || 'database'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "¡Descarga Completa!", description: "El archivo CSV se ha descargado." });

    } catch (error: any) {
      toast({ title: "Error de Descarga", description: error.message, variant: 'destructive' });
    }
  };

  const MAX_STORAGE_MB = 50;
  const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;
  const storageUsed = database.storageSize || 0;
  const storagePercentage = Math.min((storageUsed / MAX_STORAGE_BYTES) * 100, 100);

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn flex flex-col" style={{animationDelay}}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <FaDatabase className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 overflow-hidden">
                <CardTitle className="text-xl truncate" title={database.name}>{database.name}</CardTitle>
                <CardDescription className="text-xs pt-1 flex items-center gap-1.5 whitespace-nowrap">
                   <Icon size={12} /> {getSourceName(database.source)}
                </CardDescription>
              </div>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <FaEllipsisV />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewContent} disabled={database.source !== 'google_sheets'}>
                        <FaEye className="mr-2" /> Ver Contenido
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload} disabled={database.source !== 'google_sheets'}>
                        <FaDownload className="mr-2" /> Descargar Datos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsChangeTypeDialogOpen(true)}>
                        <FaExchangeAlt className="mr-2" /> Cambiar Tipo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={() => setIsDeleteAlertOpen(true)}
                    >
                        <FaTrash className="mr-2" /> Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 text-sm">
          <p className="text-muted-foreground break-all">
            ID: <span className="font-mono text-xs">{database.id}</span>
          </p>
          {database.source === 'google_sheets' && database.accessUrl && (
            <div className="flex items-center gap-1.5">
              <FaLink className="h-3.5 w-3.5 text-accent shrink-0" />
              <a
                href={database.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
                title={database.accessUrl}
              >
                {database.accessUrl}
                <FaExternalLinkAlt className="inline-block ml-1 h-3 w-3" />
              </a>
            </div>
          )}
           {database.source === 'google_sheets' && !database.accessUrl && (
             <div className="flex items-center gap-1.5 text-destructive">
                <FaTimesCircle className="h-3.5 w-3.5" />
                <span>URL no proporcionada.</span>
              </div>
           )}

          {database.source === 'smart_db' && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FaHdd size={14} className="text-accent" /> Almacenamiento
              </h4>
              <Progress value={storagePercentage} className="h-1.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(storageUsed)}</span>
                <span>{MAX_STORAGE_MB} MB</span>
              </div>
            </div>
          )}
        </CardContent>
         <CardFooter className="flex flex-col items-start gap-2 border-t pt-3 text-xs">
            <h4 className="font-semibold">Vinculado a:</h4>
            {linkedAssistants.length > 0 ? (
                 <div className="flex flex-wrap gap-1">
                    {linkedAssistants.map(name => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No está vinculado a ningún asistente.</p>
            )}
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta base de datos?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la base de datos <span className="font-bold">"{database.name}"</span>.
                {linkedAssistants.length > 0 && (
                    <div className="mt-2 text-destructive bg-destructive/10 p-2 rounded-md">
                        <p className="font-bold">¡Atención!</p>
                        <p>Esta base de datos está actualmente vinculada a los siguientes asistentes: <span className="font-semibold">{linkedAssistants.join(', ')}</span>. Serán desvinculados.</p>
                    </div>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ChangeDatabaseTypeDialog 
        isOpen={isChangeTypeDialogOpen}
        onOpenChange={setIsChangeTypeDialogOpen}
        database={database}
      />
    </>
  );
};

export default DatabaseInfoCard;
