
import { type MetadataRoute } from 'next';
import { APP_NAME } from '@/config/appConfig';

// Asegúrate de que esta sea tu URL de producción.
// Es MUY RECOMENDABLE configurar NEXT_PUBLIC_BASE_URL en tus variables de entorno.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.tu-dominio.com'; // CAMBIA ESTO

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
      priority: 0.5, // Prioridad más baja que la landing page
    },
    {
      url: `${BASE_URL}/privacy`, // Nueva página de política de privacidad
      lastModified: new Date(),
      changeFrequency: 'yearly', // Las políticas de privacidad no suelen cambiar tan a menudo
      priority: 0.3,
    },
    // Puedes añadir aquí otras páginas públicas importantes si las tienes
    // Ejemplo:
    // {
    //   url: `${BASE_URL}/contacto`,
    //   lastModified: new Date(),
    //   changeFrequency: 'yearly',
    //   priority: 0.7,
    // },
  ];
}

    