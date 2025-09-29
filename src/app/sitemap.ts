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
      url: `${BASE_URL}/make`, // Nueva página de creación
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`, // La página de login
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/chat/begin`, 
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/app`, // Punto de entrada a la aplicación (wizard, reconfig)
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
     {
      url: `${BASE_URL}/dashboard`, // El panel principal
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
    {
      url: `${BASE_URL}/colaboradores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
     {
      url: `${BASE_URL}/try`, // No queremos que se indexe directamente
      lastModified: new Date(),
      priority: 0.1,
    },
  ];
}
