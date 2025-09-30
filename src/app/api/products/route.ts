// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types';

// This is a mock database for demonstration.
// In a real application, you would fetch this from your actual database
// based on the assistant's configuration (e.g., its linked databaseId).
const demoProducts: { [key: string]: Product[] } = {
  'default': [
    { id: 'prod-1', name: 'Asesoría de Marketing Digital', price: 1500.00, imageUrl: 'https://i.imgur.com/8p8Yf9u.png' },
    { id: 'prod-2', name: 'Paquete de Redes Sociales', price: 2500.00, imageUrl: 'https://i.imgur.com/8p8Yf9u.png' },
    { id: 'prod-3', name: 'Campaña de Google Ads', price: 3000.00, imageUrl: 'https://i.imgur.com/8p8Yf9u.png' },
    { id: 'prod-4', name: 'Diseño de Logotipo', price: 1800.00, imageUrl: 'https://i.imgur.com/8p8Yf9u.png' },
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assistantId = searchParams.get('assistantId');

  if (!assistantId) {
    return NextResponse.json({ message: 'Se requiere el ID del asistente.' }, { status: 400 });
  }

  // Find the products for the given assistantId.
  // For this demo, we'll just return the default list if a specific one isn't found.
  const products = demoProducts[assistantId] || demoProducts['default'];

  return NextResponse.json({ products });
}
