
import { type MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`, // Tu página de marketing principal
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/app`, // Punto de entrada a la aplicación (login/setup/redirect)
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
     {
      url: `${BASE_URL}/dashboard`, // El panel principal
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/privacy`, // Política de privacidad
      lastModified: new Date(),
      changeFrequency: 'yearly', 
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`, // Términos y condiciones
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
