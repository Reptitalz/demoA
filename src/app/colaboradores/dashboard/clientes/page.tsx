
"use client";

import { useState } from 'react';
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const demoClients = [
    { id: 1, name: 'Pastelería Dulce Rincón', status: 'Activo', joined: new Date('2024-07-15'), earnings: 150.00, credits: 10 },
    { id: 2, name: 'Taller Mecánico Veloz', status: 'Prueba', joined: new Date('2024-07-28'), earnings: 0.00, credits: 0 },
    { id: 3, name: 'Estética Bella Imagen', status: 'Inactivo', joined: new Date('2024-06-20'), earnings: 30.00, credits: 2 },
    { id: 4, name: 'Restaurante El Sazón', status: 'Activo', joined: new Date('2024-05-10'), earnings: 450.00, credits: 30 },
    { id: 5, name: 'Consultorio Dental Sonrisas', status: 'Activo', joined: new Date('2024-07-01'), earnings: 75.00, credits: 5 },
];

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Activo': 'default',
    'Prueba': 'secondary',
    'Inactivo': 'destructive'
};

const CollaboratorClientsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = demoClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Mis Clientes Referidos
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Aquí puedes ver el estado y rendimiento de tus clientes.
                    </p>
                </div>
            </div>

            <Card className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredClients.length > 0 ? filteredClients.map(client => (
                            <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-semibold">{client.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Se unió {formatDistanceToNow(client.joined, { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className="text-center">
                                        <p className="text-xs text-muted-foreground">Ingresos</p>
                                        <p className="font-bold text-green-500">${client.earnings.toFixed(2)}</p>
                                    </div>
                                    <Badge variant={statusVariantMap[client.status]}>{client.status}</Badge>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-4">No se encontraron clientes.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </PageContainer>
    );
}

export default CollaboratorClientsPage;
