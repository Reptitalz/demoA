
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser, FaEnvelope, FaKey, FaCopy, FaUniversity, FaSave } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/providers/AppProvider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useSession } from "next-auth/react";

const CollaboratorProfilePage = () => {
    const { toast } = useToast();
    const { state } = useApp();
    const { userProfile, loadingStatus } = state;
    const { status } = useSession();

    const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/login?ref=${userProfile.firebaseUid ? userProfile.firebaseUid.substring(0, 8) : 'ABC12345'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({
                title: "Enlace Copiado",
                description: "Tu enlace de referido ha sido copiado.",
            });
        });
    };

    if (loadingStatus.active || status === 'loading') {
        return (
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        );
    }
    
    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Perfil de Colaborador
                </h2>
                <p className="text-sm text-muted-foreground">
                    Gestiona tu información personal, de pago y de seguridad.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                        <CardHeader>
                            <CardTitle>Información Personal</CardTitle>
                            <CardDescription>Estos datos se utilizan para identificarte en la plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={userProfile.imageUrl || "https://picsum.photos/seed/collab/100"} />
                                    <AvatarFallback>{userProfile.firstName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Button variant="outline" disabled>Cambiar Foto</Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="firstName">Nombre</Label>
                                    <Input id="firstName" defaultValue={userProfile.firstName} disabled />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="lastName">Apellido</Label>
                                    <Input id="lastName" defaultValue={userProfile.lastName} disabled />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" defaultValue={userProfile.email} disabled />
                            </div>
                            <Button disabled>Guardar Cambios</Button>
                        </CardContent>
                    </Card>

                     <Card className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                        <CardHeader>
                            <CardTitle>Datos de Transferencia Bancaria</CardTitle>
                            <CardDescription>Ingresa tus datos para recibir tus ganancias. Los pagos se realizan el día 15 de cada mes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="bankName">Nombre del Banco</Label>
                                <Input id="bankName" placeholder="Ej: BBVA, Santander, etc." />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="accountHolder">Nombre del Titular de la Cuenta</Label>
                                <Input id="accountHolder" placeholder="Tu nombre completo como aparece en la cuenta" />
                            </div>
                             <div className="space-y-1">
                                <Label htmlFor="clabe">CLABE Interbancaria (18 dígitos)</Label>
                                <Input id="clabe" placeholder="XXXXXXXXXXXXXXXXXX" maxLength={18} />
                            </div>
                            <Button disabled><FaSave className="mr-2" /> Guardar Datos Bancarios</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                        <CardHeader>
                            <CardTitle>Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-1">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input id="password" type="password" value="************" disabled />
                            </div>
                            <Button variant="secondary" disabled>Cambiar Contraseña</Button>
                        </CardContent>
                    </Card>
                    <Card className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                        <CardHeader>
                            <CardTitle>Tu Enlace de Referido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           <Input value={referralLink} readOnly />
                           <Button className="w-full" onClick={handleCopy}>
                               <FaCopy className="mr-2" /> Copiar Enlace
                           </Button>
                        </CardContent>
                    </Card>
                </div>

            </div>

        </PageContainer>
    );
};

export default CollaboratorProfilePage;
