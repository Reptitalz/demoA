"use client";
import type { DatabaseConfig, DatabaseSource } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaDatabase, FaLink, FaExternalLinkAlt, FaTimesCircle, FaGoogle, FaBrain, FaEllipsisV, FaTrash, FaEye, FaExchangeAlt } from "react-icons/fa";
import { useApp } from "@/providers/AppProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DatabaseInfoCardProps {
  database: DatabaseConfig;
  animationDelay?: string;
}

const DatabaseInfoCard = ({ database, animationDelay = "0s" }: DatabaseInfoCardProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
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

  const handleChangeType = () => {
    toast({
      title: "Próximamente",
      description: "La funcionalidad para cambiar el tipo de base de datos estará disponible pronto.",
    });
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn flex flex-col" style={{animationDelay}}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <FaDatabase className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <CardTitle className="text-xl truncate" title={database.name}>{database.name}</CardTitle>
                <CardDescription className="text-xs pt-1 flex items-center gap-1.5 whitespace-nowrap">
                   <Icon size={12} /> {getSourceName(database.source)}
                </CardDescription>
              </div>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FaEllipsisV />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewContent} disabled={database.source !== 'google_sheets'}>
                        <FaEye className="mr-2" /> Ver Contenido
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleChangeType}>
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
          <p className="text-muted-foreground">
            ID: <span className="font-mono text-xs">{database.id.substring(0,15)}...</span>
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
    </>
  );
};

export default DatabaseInfoCard;
