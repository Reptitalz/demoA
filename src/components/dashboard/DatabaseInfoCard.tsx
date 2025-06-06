
"use client";
import type { DatabaseConfig, DatabaseSource } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaDatabase, FaLink, FaExternalLinkAlt, FaTimesCircle, FaGoogle, FaBrain } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import DatabaseConnectionsDialog from "./DatabaseConnectionsDialog";
import { cn } from "@/lib/utils";

interface DatabaseInfoCardProps {
  database: DatabaseConfig;
  animationDelay?: string;
}

const DatabaseInfoCard = ({ database, animationDelay = "0s" }: DatabaseInfoCardProps) => {
  const [isConnectionsDialogOpen, setIsConnectionsDialogOpen] = useState(false);

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

  const getDisplayDetails = () => {
    if (database.source === 'google_sheets' && database.details) {
        // Assuming details might store original Excel filename if it was converted
        // Or simply the user-provided name for the GSheet if linked directly.
        return `Nombre descriptivo: ${database.details}`; 
    }
    if (database.source === 'smart_db' && database.details) {
        return `Descripción: ${database.details}`;
    }
    return null; 
  }

  const displayDetailsText = getDisplayDetails();

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn flex flex-col" style={{animationDelay}}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaDatabase className="h-8 w-8 text-primary" />
              <CardTitle className="text-xl truncate" title={database.name}>{database.name.length > 25 ? `${database.name.substring(0,22)}...` : database.name}</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm">
              <Icon size={14} /> {getSourceName(database.source)}
            </Badge>
          </div>
          {displayDetailsText && (
              <CardDescription className="text-xs pt-1 truncate" title={database.details || ""}>
                  {displayDetailsText}
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <p className="text-muted-foreground">
            ID: <span className="font-mono text-xs">{database.id.substring(0,15)}...</span>
          </p>
          {database.source === 'google_sheets' && database.accessUrl && (
            <div className="flex items-center gap-1.5">
              <FaLink className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium text-foreground">URL Hoja:</span>
              <a
                href={database.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
                title={database.accessUrl}
              >
                {database.accessUrl.length > 30 ? `${database.accessUrl.substring(0,27)}...` : database.accessUrl}
                <FaExternalLinkAlt className="inline-block ml-1 h-3 w-3" />
              </a>
            </div>
          )}
           {database.source === 'google_sheets' && !database.accessUrl && (
             <div className="flex items-center gap-1.5 text-destructive">
                <FaTimesCircle className="h-3.5 w-3.5" />
                <span>URL de la Hoja de Google no disponible.</span>
              </div>
           )}
        </CardContent>
        <CardFooter className={cn("border-t pt-3 flex flex-col sm:flex-row gap-2 items-center", (database.source === 'google_sheets' && database.accessUrl) ? "justify-between" : "justify-center")}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectionsDialogOpen(true)}
            className="w-full sm:w-auto transition-transform transform hover:scale-105 text-xs"
          >
            <FaLink size={14} className="mr-1.5" />
            Asistentes Vinculados
          </Button>
          {database.source === 'google_sheets' && database.accessUrl && (
            <Button asChild size="sm" className="w-full sm:w-auto transition-transform transform hover:scale-105 text-xs bg-brand-gradient text-primary-foreground hover:opacity-90">
              <a href={database.accessUrl} target="_blank" rel="noopener noreferrer">
                <FaExternalLinkAlt size={14} className="mr-1.5" />
                Abrir Enlace
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
      <DatabaseConnectionsDialog
        isOpen={isConnectionsDialogOpen}
        onOpenChange={setIsConnectionsDialogOpen}
      />
    </>
  );
};

export default DatabaseInfoCard;

