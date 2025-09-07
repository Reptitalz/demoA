
"use client";

import PageContainer from "@/components/layout/PageContainer";
import { Brain } from "lucide-react";

const BrainPage = () => {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center text-center py-20 animate-fadeIn">
        <Brain className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Cerebro del Asistente</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Próximamente: un centro para visualizar y gestionar el conocimiento de tus asistentes.
        </p>
      </div>
    </PageContainer>
  );
};

export default BrainPage;
