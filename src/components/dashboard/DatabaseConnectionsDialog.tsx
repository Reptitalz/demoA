
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle as SmallCardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/AppProvider";
import { FaRobot, FaDatabase, FaLink, FaGoogle, FaBrain } from "react-icons/fa";
import type { DatabaseConfig, DatabaseSource } from "@/types";

interface DatabaseConnectionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDatabaseIcon = (source: DatabaseSource) => {
  if (source === "google_sheets") return FaGoogle;
  if (source === "smart_db") return FaBrain;
  return FaDatabase; 
};

const getSourceName = (source: DatabaseConfig['source']) => {
  if(source === 'google_sheets') return 'Hojas de Google';
  if(source === 'smart_db') return 'Base de Datos Inteligente';
  return 'Fuente Desconocida';
};

const DatabaseConnectionsDialog = ({ isOpen, onOpenChange }: DatabaseConnectionsDialogProps) => {
  const { state } = useApp();
  const { databases, assistants } = state.userProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl lg:max-w-2xl min-h-[70vh] bg-card flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FaLink size={24} className="text-primary" />
            Conexiones de Bases de Datos y Asistentes
          </DialogTitle>
          <DialogDescription>
            Visualiza todas tus bases de datos y los asistentes que están vinculados a cada una.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 -mr-2 mt-4">
          {databases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
              <FaDatabase size={48} className="mb-4" />
              <p>No hay bases de datos configuradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {databases.map((db) => {
                const linkedAssistants = assistants.filter(asst => asst.databaseId === db.id);
                const DbIcon = getDatabaseIcon(db.source);

                return (
                  <Card key={db.id} className="shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DbIcon className="h-6 w-6 text-primary" />
                          <SmallCardTitle className="text-lg">{db.name}</SmallCardTitle>
                        </div>
                        <Badge variant="secondary">{getSourceName(db.source)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-semibold mb-2 text-foreground flex items-center gap-1.5">
                        <FaRobot size={16} className="text-accent" /> Asistentes Vinculados:
                      </h4>
                      {linkedAssistants.length > 0 ? (
                        <ul className="space-y-1 list-disc list-inside pl-1 text-sm text-muted-foreground">
                          {linkedAssistants.map(asst => (
                            <li key={asst.id} className="flex items-center gap-1.5">
                               <Badge variant="outline" className="font-normal">{asst.name}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                           No hay asistentes vinculados a esta base de datos. 
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DatabaseConnectionsDialog;

