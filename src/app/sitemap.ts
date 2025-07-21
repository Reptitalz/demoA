
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
      url: `${BASE_URL}/app`, // Punto de entrada a la aplicación (puede ser la página de login/setup)
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`, // Nueva página de política de privacidad
      lastModified: new Date(),
      changeFrequency: 'yearly', // Las políticas de privacidad no suelen cambiar tan a menudo
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`, // Nueva página de términos y condiciones
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
