
"use client";

import { useApp } from "@/providers/AppProvider";
import { cn } from "@/lib/utils";
import { FaWhatsapp, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { AppWindow } from 'lucide-react';
import { Label } from "@/components/ui/label";

const assistantTypeOptions = [
    {
        id: 'whatsapp' as const,
        name: "Asistente en WhatsApp",
        description: "La solución completa para automatizar la comunicación con tus clientes directamente en la plataforma que más usan.",
        icon: FaWhatsapp
    }
];

const Step0AssistantType = () => {
    const { state, dispatch } = useApp();
    const { assistantType } = state.wizard;

    const handleTypeSelect = (type: 'desktop' | 'whatsapp') => {
        dispatch({ type: 'UPDATE_ASSISTANT_TYPE', payload: type });
    };

    return (
        <div className="w-full animate-fadeIn space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold">Elige el Tipo de Asistente</h3>
                <p className="text-sm text-muted-foreground">¿Dónde vivirá tu asistente? Puedes cambiar esto o añadir más asistentes después.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assistantTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isChecked = assistantType === option.id;

                    return (
                        <div
                            key={option.id}
                            onClick={() => handleTypeSelect(option.id)}
                            className={cn(
                                "flex items-start space-x-4 p-4 border rounded-lg transition-all duration-200 relative",
                                'hover:bg-muted/50 cursor-pointer hover:shadow-md hover:border-green-500/50',
                                isChecked ? 'border-green-500 bg-green-500/10 shadow-lg' : 'bg-card'
                            )}
                        >
                            {isChecked
                                ? <FaCheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-500 shrink-0" />
                                : <FaRegCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground/50 shrink-0" />
                            }

                            {Icon && <Icon className="h-8 w-8 text-green-500 mt-1" />}
                            <div className="flex-1 pr-4">
                                <Label className="font-semibold text-sm cursor-pointer">
                                    {option.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Step0AssistantType;
