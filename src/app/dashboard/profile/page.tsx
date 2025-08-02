
"use client";

import React, from 'react';
import { Suspense, useState } from 'react';

import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import PageContainer from '@/components/layout/PageContainer';
import AppIcon from '@/components/shared/AppIcon';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  HelpCircle,
  KeyRound,
  Palette,
  User,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

function ProfilePageContent() {
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  return (
    <>
      <PageContainer className="space-y-6">
        <div className="animate-fadeIn">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Perfil y Soporte
          </h2>
          <p className="text-sm text-muted-foreground">
            Administra tu información, apariencia y obtén ayuda.
          </p>
        </div>

        <Card
          className="animate-fadeIn transition-all hover:shadow-lg"
          style={{ animationDelay: '0.1s' }}
        >
          <CardContent className="p-0">
            <div className="flex flex-col">
              {/* Personal Info Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <User className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Información Personal</h3>
                    <p className="text-sm text-muted-foreground">
                      Actualiza tus datos personales y de facturación.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsPersonalInfoOpen(true)}
                  className="shrink-0"
                >
                  Editar
                </Button>
              </div>
              <Separator />

              {/* Security Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <KeyRound className="h-6 w-6 text-destructive" />
                  <div>
                    <h3 className="font-semibold">Seguridad</h3>
                    <p className="text-sm text-muted-foreground">
                      ¿Olvidaste tu contraseña? Inicia la recuperación.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="shrink-0"
                >
                  Recuperar
                </Button>
              </div>
              <Separator />

              {/* Appearance Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <Palette className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Apariencia</h3>
                    <p className="text-sm text-muted-foreground">
                      Elige entre el tema claro y el oscuro.
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              <Separator />

              {/* Support Section */}
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Soporte Técnico</h3>
                    <p className="text-sm text-muted-foreground">
                      ¿Necesitas ayuda? Contáctanos por WhatsApp.
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Link
                    href="https://wa.me/5213344090167"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contactar
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>

      <PersonalInfoDialog
        isOpen={isPersonalInfoOpen}
        onOpenChange={setIsPersonalInfoOpen}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
          <LoadingSpinner size={36} />
        </PageContainer>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
