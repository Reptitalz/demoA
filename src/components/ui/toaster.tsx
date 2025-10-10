
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Button } from "./button"
import { FaCopy } from "react-icons/fa"
import { useState, useEffect } from "react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(function ({ id, title, description, action, copyable, ...props }) {
        const handleCopy = () => {
          const textToCopy = `${title ? title + '\n' : ''}${description || ''}`;
          navigator.clipboard.writeText(textToCopy);
          // Optional: show a confirmation toast
           const { toast } = useToast();
           toast({ title: "Copiado", description: "El mensaje de error ha sido copiado." });
        };
        
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {copyable && (
              <Button variant="outline" size="sm" onClick={handleCopy} className="mt-2">
                <FaCopy className="mr-2 h-4 w-4"/>
                Copiar
              </Button>
            )}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </>
  )
}
