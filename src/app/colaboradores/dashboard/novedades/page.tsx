
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { FaBullhorn, FaLightbulb, FaRocket } from "react-icons/fa";

const newsItems = [
    {
        category: "Nueva Función",
        title: "¡Bases de Datos Inteligentes ya están aquí!",
        description: "Ahora puedes crear bases de datos que la IA gestiona por sí misma. Añade conocimiento y deja que tu asistente aprenda y responda con mayor precisión.",
        imageUrl: "/4.jpeg",
        imageHint: "database feature",
        icon: FaRocket,
        date: "29 de Julio, 2024"
    },
    {
        category: "Consejo Pro",
        title: "Mejora tus Prompts para Mejores Ventas",
        description: "Un prompt bien definido es la clave del éxito. Incluye ejemplos claros de conversación, define la personalidad y establece reglas estrictas para maximizar la efectividad.",
        imageUrl: "/5.jpeg",
        imageHint: "sales prompt",
        icon: FaLightbulb,
        date: "25 de Julio, 2024"
    },
    {
        category: "Anuncio",
        title: "Expansión del Programa de Colaboradores",
        description: "Estamos buscando nuevos aliados para llevar la automatización con IA a más negocios. ¡Invita a otros y gana comisiones por sus referidos!",
        imageUrl: "/1.jpeg",
        imageHint: "collaboration announcement",
        icon: FaBullhorn,
        date: "20 de Julio, 2024"
    }
];

const categoryColors = {
    "Nueva Función": "bg-blue-500",
    "Consejo Pro": "bg-yellow-500",
    "Anuncio": "bg-green-500"
};

const CollaboratorNewsPage = () => {
    return (
        <PageContainer className="space-y-6">
            <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Novedades y Anuncios
                </h2>
                <p className="text-sm text-muted-foreground">
                    Mantente al día con las últimas noticias y consejos para maximizar tus ganancias.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                        <CardHeader className="p-0">
                            <div className="relative aspect-video">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={600}
                                    height={400}
                                    className="w-full h-full object-cover"
                                    data-ai-hint={item.imageHint}
                                />
                                <Badge className={`absolute top-3 right-3 ${categoryColors[item.category as keyof typeof categoryColors]}`}>
                                    <item.icon className="mr-1.5" />
                                    {item.category}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">{item.date}</p>
                            <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                            <CardDescription className="text-sm">{item.description}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}

export default CollaboratorNewsPage;
