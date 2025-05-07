
"use client";
import type { DatabaseConfig } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, FileSpreadsheet, DatabaseZap } from "lucide-react";

interface DatabaseInfoCardProps {
  database: DatabaseConfig;
  animationDelay?: string;
}

const DatabaseInfoCard = ({ database, animationDelay = "0s" }: DatabaseInfoCardProps) => {
  const Icon = database.source === "excel" || database.source === "google_sheets" ? FileSpreadsheet : DatabaseZap;

  const getSourceName = (source: DatabaseConfig['source']) => {
    switch(source) {
      case 'excel': return 'Archivo Excel';
      case 'google_sheets': return 'Hojas de Google';
      case 'smart_db': return 'Base de Datos Inteligente';
      default: return 'Fuente Desconocida';
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay}}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl truncate" title={database.name}>{database.name.length > 20 ? `${database.name.substring(0,20)}...` : database.name}</CardTitle>
          </div>
           <Badge variant="outline" className="flex items-center gap-1.5 whitespace-nowrap">
            <Icon size={14} /> {getSourceName(database.source)}
          </Badge>
        </div>
        {database.details && typeof database.details === 'string' && (
            <CardDescription className="text-sm pt-1 truncate" title={database.details}>
                Fuente: {database.details.length > 30 ? `${database.details.substring(0,30)}...` : database.details}
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          ID: <span className="font-mono text-xs">{database.id.substring(0,15)}...</span>
        </p>
        {/* Placeholder for more database stats or actions */}
      </CardContent>
    </Card>
  );
};

export default DatabaseInfoCard;
