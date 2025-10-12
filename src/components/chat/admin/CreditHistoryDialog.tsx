// src/components/chat/admin/CreditHistoryDialog.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReceiptDialog from './ReceiptDialog';
import { CreditLine } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


interface CreditHistoryDialogProps {
  credit: CreditLine | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreditHistoryDialog = ({ credit, isOpen, onOpenChange }: CreditHistoryDialogProps) => {
    const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

    // This is demo data. In a real app, you would fetch payment history for the credit line.
    const paymentHistory = useMemo(() => {
        if (!credit) return [];
        return [
            { id: 1, receivedAt: new Date('2024-07-28'), amount: 500, receiptUrl: 'https://placehold.co/600x800.png', userName: credit.applicantIdentifier },
            { id: 2, receivedAt: new Date('2024-07-21'), amount: 500, receiptUrl: 'https://placehold.co/600x800.png', userName: credit.applicantIdentifier },
        ];
    }, [credit]);
    
    if (!credit) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="w-screen h-screen max-w-full flex flex-col sm:max-w-lg sm:h-auto sm:max-h-[90vh]">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Historial de Crédito: {credit.applicantIdentifier}</DialogTitle>
                        <DialogDescription>Revisa los detalles y pagos de esta línea de crédito.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-grow">
                        <div className="p-4 space-y-4">
                            <Card>
                                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Monto Total</p>
                                        <p className="text-2xl font-bold">${credit.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Estado</p>
                                        <p className={cn("text-2xl font-bold", credit.status === 'Atrasado' ? 'text-destructive' : 'text-green-600')}>{credit.status}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <div>
                                <h4 className="font-semibold mb-2">Historial de Pagos</h4>
                                <div className="space-y-2">
                                    {paymentHistory.map(payment => (
                                        <div key={payment.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold">${payment.amount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(payment.receivedAt), 'dd MMM, yyyy', { locale: es })}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => setSelectedReceipt(payment)}>
                                                <Eye className="mr-2 h-4 w-4"/> Ver Comprobante
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ReceiptDialog 
                payment={selectedReceipt}
                isOpen={!!selectedReceipt}
                onOpenChange={(open) => !open && setSelectedReceipt(null)}
            />
        </>
    )
}

export default CreditHistoryDialog;
