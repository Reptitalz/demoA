"use client";

import { useState, Suspense } from 'react';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import DatabaseInfoCard from '@/components/dashboard/DatabaseInfoCard';
import { Button } from '@/components/ui/button';
import { FaPlusCircle, FaDatabase } from 'react-icons/fa';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import AddDatabaseDialog from '@/components/dashboard/AddDatabaseDialog';

function DatabasesPageContent() {
    const { state } = useApp();
    const { userProfile, isLoading } = state;
    const [isAddDatabaseDialogOpen, setIsAddDatabaseDialogOpen] = useState(false);

    const showAddDatabaseButton = userProfile.assistants.some(a => !a.databaseId);

    if (isLoading) {
        return <LoadingSpinner size={36} />;
    }

    return (
        <>
        <PageContainer className="space-y-5">
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Bases de Datos</h2>
                <p className="text-sm text-muted-foreground">Administra las fuentes de datos conectadas a tus asistentes.</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FaDatabase size={18} className="text-primary" />
                        Bases de Datos Vinculadas
                    </h3>
                    {showAddDatabaseButton && (
                        <Button onClick={() => setIsAddDatabaseDialogOpen(true)} size="sm" className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
                            <FaPlusCircle size={13} className="mr-1" />
                            Añadir Base de Datos
                        </Button>
                    )}
                </div>
                {userProfile.databases.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {userProfile.databases.map((db, index) => (
                            <DatabaseInfoCard key={db.id} database={db} animationDelay={`${0.2 + index * 0.1}s`} />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        <CardContent className="flex flex-col items-center gap-3">
                            <FaDatabase size={40} className="text-muted-foreground" />
                            <h3 className="text-lg font-semibold">No tienes bases de datos</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                Conecta una Hoja de Google o crea una Base de Datos Inteligente para darle a tus asistentes el conocimiento que necesitan para operar.
                            </p>
                            {showAddDatabaseButton && (
                                <Button onClick={() => setIsAddDatabaseDialogOpen(true)} size="sm" className="text-sm px-4 py-2 mt-2">Añadir Base de Datos</Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageContainer>
        <AddDatabaseDialog
            isOpen={isAddDatabaseDialogOpen}
            onOpenChange={setIsAddDatabaseDialogOpen}
        />
        </>
    );
}

export default function DatabasesPage() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <DatabasesPageContent />
        </Suspense>
    );
}
