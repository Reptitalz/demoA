
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";

export default function NotFound() {
  return (
    <PageContainer className="flex flex-col items-center justify-center text-center">
      <h1 className="text-9xl font-extrabold text-brand-gradient tracking-tighter">
        404
      </h1>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Página No Encontrada
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Volver a la Página Principal</Link>
      </Button>
    </PageContainer>
  );
}
