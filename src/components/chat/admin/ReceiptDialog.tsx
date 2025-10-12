// src/components/chat/admin/ReceiptDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bot, XCircle, Check, FileText } from 'lucide-react';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import Image from 'next/image';
import { extractAmountFromImage } from '@/ai/flows/extract-amount-flow';

const ReceiptDialog = ({ payment, isOpen, onOpenChange, onAction }: { payment: any | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onAction?: (id: number, action: 'authorize' | 'reject', amount?: number) => void }) => {
    const { toast } = useToast();
    const [isReadingAmount, setIsReadingAmount] = useState(false);
    const [extractedAmount, setExtractedAmount] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setExtractedAmount(null);
        }
    }, [isOpen]);

    if (!payment) return null;

    const receiptUrl = payment.receiptUrl || '';
    const isVideo = receiptUrl.startsWith('data:video');
    const isAudio = receiptUrl.startsWith('data:audio');
    const isImage = receiptUrl.startsWith('data:image');
    const isPDF = receiptUrl.includes('application/pdf');

    const handleReadAmount = async () => {
        if (!isImage) {
            toast({ title: 'No Soportado', description: 'La lectura de monto solo está disponible para imágenes.', variant: 'default' });
            return;
        }
        setIsReadingAmount(true);
        try {
            const result = await extractAmountFromImage({ image: receiptUrl });
            if (result > 0) {
                setExtractedAmount(result);
                toast({ title: 'Monto Encontrado', description: `Se detectó un monto de $${result.toLocaleString()}` });
            } else {
                toast({ title: 'No se encontró un monto', description: 'No se pudo extraer un valor monetario de la imagen.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error de IA', description: 'No se pudo procesar la imagen.', variant: 'destructive' });
        } finally {
            setIsReadingAmount(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-lg sm:h-auto sm:rounded-lg" onInteractOutside={(e) => { if (isReadingAmount) e.preventDefault(); }}>
                <DialogHeader className="p-4 sm:p-6 border-b">
                    <DialogTitle>Revisar Comprobante</DialogTitle>
                     <DialogDescription>
                         Recibido de {payment.userName} el {payment.receivedAt ? format(new Date(payment.receivedAt), "PPPp", { locale: es }) : 'fecha desconocida'}
                    </DialogDescription>
                </DialogHeader>
                <div className="h-full flex-grow flex items-center justify-center bg-muted/30 overflow-hidden p-2">
                    {isImage && <Image src={receiptUrl} alt="Comprobante" width={800} height={1200} className="max-w-full max-h-full object-contain rounded-md" />}
                    {isVideo && <video src={receiptUrl} controls className="max-w-full max-h-full rounded-md" />}
                    {isAudio && <audio src={receiptUrl} controls className="w-full" />}
                    {(isPDF || (!isImage && !isVideo && !isAudio)) && (
                        <div className="text-center p-8">
                            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4"/>
                            <p className="font-semibold">Documento: {payment.fileName || 'archivo'}</p>
                            <p className="text-sm text-muted-foreground mb-4">La previsualización no está disponible.</p>
                            <a href={receiptUrl} download={payment.fileName || 'documento'}>
                                <Button>Descargar Archivo</Button>
                            </a>
                        </div>
                    )}
                </div>
                 {onAction && (
                    <DialogFooter className="p-4 flex-col sm:flex-row gap-2">
                        <div className='flex items-center gap-2 w-full'>
                            <Button variant="outline" className="flex-1" onClick={handleReadAmount} disabled={isReadingAmount || !isImage}>
                                {isReadingAmount ? <Loader2 className="mr-2 animate-spin"/> : <Bot className="mr-2"/>}
                                Leer Monto con IA
                            </Button>
                            {extractedAmount !== null && (
                                <Input 
                                    type="number" 
                                    value={extractedAmount}
                                    onChange={(e) => setExtractedAmount(parseFloat(e.target.value))}
                                    className="w-28 text-center font-bold"
                                />
                            )}
                        </div>
                        <div className='flex items-center gap-2 w-full'>
                            <Button variant="destructive" className="flex-1" onClick={() => onAction(payment.messageId, 'reject')}><XCircle className="mr-2"/> Rechazar</Button>
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={extractedAmount === null || extractedAmount <= 0} onClick={() => onAction(payment.messageId, 'authorize', extractedAmount || 0)}>
                                <Check className="mr-2"/> Autorizar Monto
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReceiptDialog;
