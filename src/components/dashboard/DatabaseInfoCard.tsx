
"use client";
import type { DatabaseConfig } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaDatabase, FaFileExcel, FaBrain, FaLink, FaExternalLinkAlt, FaTimesCircle } from "react-icons/fa";
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

  const Icon = database.source === "excel" || database.source === "google_sheets" ? FaFileExcel : FaBrain;

  const getSourceName = (source: DatabaseConfig['source']) => {
    switch(source) {
      case 'excel': return 'Archivo Excel Original'; // Clarify it's the original if converted
      case 'google_sheets': return 'Hojas de Google';
      case 'smart_db': return 'Base de Datos Inteligente';
      default: return 'Fuente Desconocida';
    }
  };

  const getDisplayDetails = () => {
    if (database.source === 'excel' && database.details) {
      return `Archivo original: ${database.details.length > 30 ? `${database.details.substring(0,27)}...` : database.details}`;
    }
    // For Google Sheets, if 'details' was the user-given name, and 'name' is the API-returned sheet name,
    // 'name' is already in CardTitle. 'details' might be redundant or specific to original intent.
    // For now, let's not show 'details' for google_sheets if accessUrl is present, to avoid clutter.
    // If 'details' is crucial for google_sheets when accessUrl exists, this can be adjusted.
    return null;
  }

  const displayDetailsText = getDisplayDetails();

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn flex flex-col" style={{animationDelay}}>
        <CardHeader>
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
              <CardDescription className="text-xs pt-1 truncate" title={database.details}>
                  {displayDetailsText}
              </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <p className="text-muted-foreground">
            ID: <span className="font-mono text-xs">{database.id.substring(0,15)}...</span>
          </p>
          {database.source === 'google_sheets' && (
            <div>
              {database.accessUrl ? (
                <div className="flex items-center gap-1.5">
                  <FaLink className="h-3.5 w-3.5 text-accent" />
                  <span className="font-medium text-foreground">URL:</span>
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
              ) : (
                <div className="flex items-center gap-1.5 text-destructive">
                  <FaTimesCircle className="h-3.5 w-3.5" />
                  <span>URL de la Hoja de Google no disponible.</span>
                </div>
              )}
            </div>
          )}
          {database.source === 'excel' && database.accessUrl && (
            // This case is if user uploaded Excel AND manually provided a URL for it.
            // If Excel was processed to GSheet, source would become 'google_sheets'.
            <div className="flex items-center gap-1.5">
              <FaLink className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium text-foreground">URL (proporcionada):</span>
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
        </CardContent>
        <CardFooter className="border-t pt-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsConnectionsDialogOpen(true)}
            className="w-full transition-transform transform hover:scale-105 text-xs"
          >
            <FaLink size={14} className="mr-1.5" />
            Ver Asistentes Vinculados
          </Button>
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
