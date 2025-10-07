// src/app/chat/calls/page.tsx
"use client";

import React from 'react';
import { FaPhoneAlt } from 'react-icons/fa';

export default function CallsPage() {
  return (
    <div className="flex flex-col h-full bg-transparent">
       <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">Llamadas</h1>
      </header>
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <FaPhoneAlt className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Historial de Llamadas</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">
          Aquí aparecerán las llamadas realizadas y recibidas a través de la aplicación.
        </p>
      </div>
    </div>
  );
}
