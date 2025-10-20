// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/types';

// This endpoint now fetches all products from the central 'products' collection.
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // In a real application, you might add pagination here.
    // For now, we fetch all products.
    const products = await db.collection<Product>('products').find({}).toArray();

    // The 'seller' field can be populated by fetching the user profile who owns the product.
    // This is an N+1 query problem, so for now we might omit it or handle it differently.
    // For simplicity, we'll assume the client can handle displaying the product without the seller's name for now.
    
    return NextResponse.json({ products });

  } catch (error) {
    console.error('API Error (GET /api/products):', error);
    return NextResponse.json({ message: 'Error al obtener los productos' }, { status: 500 });
  }
}
