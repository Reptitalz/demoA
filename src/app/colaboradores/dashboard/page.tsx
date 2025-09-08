
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { useApp } from "@/providers/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaUsers, FaDollarSign, FaChartLine, FaClipboard } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/config/appConfig";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const CollaboratorDashboardPage = () => {
    const { state } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const { status } = useSession();
    const { userProfile, loadingStatus } = state;

    // Determine if it's demo mode by checking authentication status
    const isDemoMode = status !== 'authenticated';

    const collaboratorProfile = isDemoMode ? {
        referralCode: 'DEMO12345',
        referredUsers: 15,
        totalEarnings: 750.50,
        conversionRate: 5.2,
        firstName: 'Colaborador Demo'
    } : {
        referralCode: userProfile.firebaseUid ? userProfile.firebaseUid.substring(0, 8) : 'ABC12345',
        referredUsers: 0,
        totalEarnings: 0,
        conversionRate: 0,
        firstName: userProfile.firstName || 'Colaborador'
    };

    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/login?ref=${collaboratorProfile.referralCode}`;

    const handleCopyLink = () => {
        if (isDemoMode) {
            toast({
                title: "Modo Demostración",
                description: "La copia del enlace está deshabilitada en el modo de demostración.",
            });
            return;
        }
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({
                title: "Enlace Copiado",
                description: "Tu enlace de referido ha sido copiado al portapapeles.",
            });
        }, (err) => {
            toast({
                title: 'Error al Copiar',
                description: 'No se pudo copiar el enlace.',
                variant: 'destructive',
            });
        });
    };

    const conversionCard = {
        title: "Tasa de Conversión",
        value: `${collaboratorProfile.conversionRate}%`,
        description: "Visitas vs. registros.",
        icon: <FaChartLine className="h-5 w-5 text-orange-500" />
    };

    if (loadingStatus.active && !isDemoMode) {
        return (
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        );
    }

    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Panel de Colaborador
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Bienvenido, {collaboratorProfile.firstName}. Aquí puedes seguir tu progreso.
                    </p>
                </div>
                 {isDemoMode && (
                    <Button onClick={() => router.push('/colaboradores/login')}>
                        Iniciar Sesión / Registrarse
                    </Button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 sm:col-span-1">
                    <CardContent className="p-4 flex items-center justify-around h-full">
                        {/* Users Section */}
                        <div className="text-center space-y-1">
                            <FaUsers className="h-6 w-6 text-blue-500 mx-auto" />
                            <p className="text-sm font-medium">Usuarios Referidos</p>
                            <p className="text-2xl font-bold">{collaboratorProfile.referredUsers.toLocaleString()}</p>
                        </div>
                        <Separator orientation="vertical" className="h-16 mx-4" />
                        {/* Earnings Section */}
                        <div className="text-center space-y-1">
                            <FaDollarSign className="h-6 w-6 text-green-500 mx-auto" />
                            <p className="text-sm font-medium">Ingresos Generados</p>
                            <p className="text-2xl font-bold">${collaboratorProfile.totalEarnings.toFixed(2)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 sm:col-span-1">
                     <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full space-y-1">
                        {conversionCard.icon}
                        <p className="text-sm font-medium">{conversionCard.title}</p>
                        <p className="text-2xl font-bold">{conversionCard.value}</p>
                        <p className="text-xs text-muted-foreground">{conversionCard.description}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Link Card */}
            <Card className="animate-fadeIn glow-card" style={{ animationDelay: '0.4s' }}>
                <CardHeader>
                    <CardTitle>Tu Enlace de Referido</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">
                        Comparte este enlace con tus clientes para que se registren. Todas las recargas que hagan te generarán una comisión.
                    </p>
                </CardHeader>
                <CardContent className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-grow w-full bg-transparent border-input rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
                        />
                        <Button onClick={handleCopyLink} size="sm" className="w-full sm:w-auto shrink-0">
                            <FaClipboard className="mr-2" /> Copiar Enlace
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground pt-4 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                <p>Las estadísticas se actualizan cada 24 horas.</p>
                <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
            </div>
        </PageContainer>
    );
}

export default CollaboratorDashboardPage;
