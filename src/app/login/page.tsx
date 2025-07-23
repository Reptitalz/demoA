"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { LogIn, UserPlus, Phone, Key } from 'lucide-react';

const APP_NAME = "Hey Manito";

const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
  <div className="animate-spin rounded-full border-4 border-t-transparent border-gray-400" style={{ width: size, height: size }} />
);

const LoginPageContent = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber) || !password) {
      alert("Por favor, ingresa un número de teléfono y contraseña válidos.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');

      alert("¡Bienvenido/a de nuevo!");
      router.replace('/dashboard');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartSetup = () => {
    router.push('/app?action=add');
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-2">Inicia sesión o crea tu primer asistente inteligente.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> Número de Teléfono
            </label>
            <input
              id="phone-number"
              type="tel"
              placeholder="+52 123 456 7890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-indigo-300 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Key className="h-4 w-4" /> Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring focus:ring-indigo-300 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-brand-gradient text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isProcessing ? <LoadingSpinner size={20} /> : <LogIn className="h-4 w-4" />}
            Iniciar Sesión
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">O si eres nuevo</span>
          </div>
        </div>

        <button
          onClick={handleStartSetup}
          className="w-full border border-gray-300 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-all duration-300 flex justify-center items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Crear Asistente
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={36} />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
