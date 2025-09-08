
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser, FaEnvelope, FaKey, FaCopy } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

const CollaboratorProfilePage = () => {
    const { toast } = useToast();
    const referralLink = "https://heymanito.com/login?ref=DEMO12345";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({
                title: "Enlace Copiado",
                description: "Tu enlace de referido ha sido copiado.",
            });
        });
    };
    
    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Perfil de Colaborador (Demo)
                </h2>
                <p className="text-sm text-muted-foreground">
                    Gestiona tu información personal y de seguridad.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Estos datos se utilizan para identificarte en la plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                             <Avatar className="h-16 w-16">
                                <AvatarImage src="https://picsum.photos/seed/collab/100" />
                                <AvatarFallback>CD</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" disabled>Cambiar Foto</Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="firstName">Nombre</Label>
                                <Input id="firstName" defaultValue="Colaborador" disabled />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="lastName">Apellido</Label>
                                <Input id="lastName" defaultValue="Demo" disabled />
                            </div>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" defaultValue="colaborador.demo@heymanito.com" disabled />
                        </div>
                         <Button disabled>Guardar Cambios</Button>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
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
                    <Card className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
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
