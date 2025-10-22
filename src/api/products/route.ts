// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product, UserProfile } from '@/types';

// This endpoint now fetches all products from all user profiles.
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    // Fetch all user profiles that have catalogs.
    const profilesWithCatalogs = await db.collection<UserProfile>('userProfiles').find({ 
      catalogs: { $exists: true, $not: { $size: 0 } } 
    }).toArray();

    const allProducts: Product[] = [];

    for (const profile of profilesWithCatalogs) {
      for (const catalog of (profile.catalogs || [])) {
        let sellerName = 'Vendedor Desconocido';
        if (catalog.promoterType === 'user') {
          sellerName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        } else {
          const assistant = profile.assistants.find(a => a.id === catalog.promoterId);
          sellerName = assistant?.name || 'Asistente';
        }
        
        for (const product of catalog.products) {
          allProducts.push({
            ...product,
            seller: sellerName,
            location: profile.address?.city || 'Ubicación no disponible', // Use city as location
          });
        }
      }
    }
    
    return NextResponse.json({ products: allProducts });

  } catch (error) {
    console.error('API Error (GET /api/products):', error);
    return NextResponse.json({ message: 'Error al obtener los productos' }, { status: 500 });
  }
}
