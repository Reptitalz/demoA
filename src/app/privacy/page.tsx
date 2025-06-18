
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <PageContainer className="space-y-6" fullWidth={true}>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-gradient mb-6 text-center">
          Política de Privacidad de {APP_NAME}
        </h1>

        <p className="mb-4 text-muted-foreground">
          Última actualización: 27 de Julio de 2024
        </p>

        <p className="mb-4">
          Bienvenido/a a {APP_NAME} ("nosotros", "nuestro"). Tu privacidad y la de los datos que gestionas a través de nuestra plataforma son de suma importancia para nosotros. Esta Política de Privacidad tiene como objetivo informarte sobre cómo manejamos la información en relación con el uso de nuestros servicios, incluyendo la interacción con tus asistentes de Inteligencia Artificial (IA) y las plataformas de WhatsApp y Facebook.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          1. Información que {APP_NAME} Maneja
        </h2>
        <p className="mb-4">
          {APP_NAME} como plataforma está diseñado para ser una herramienta que TÚ controlas.
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Datos de Configuración de Cuenta y Asistentes:</strong> Para operar el servicio, almacenamos la información que proporcionas al configurar tu cuenta (por ejemplo, dirección de correo electrónico, plan de suscripción) y tus asistentes (por ejemplo, nombre del asistente, propósitos seleccionados, configuración de la base de datos vinculada como el ID de una Hoja de Google y su URL de acceso si la proporcionas, número de teléfono vinculado). Esta información es esencial para el funcionamiento de los servicios que te ofrecemos.
          </li>
          <li>
            <strong>No Recopilación ni Monitoreo Activo del Contenido de Conversaciones:</strong> {APP_NAME} NO recopila, almacena para uso propio, ni monitorea activamente el contenido de las conversaciones que tus asistentes inteligentes tienen con tus clientes o usuarios finales a través de WhatsApp, Facebook u otras plataformas integradas. La transmisión de estos mensajes es gestionada por las plataformas correspondientes (ej. Vonage para WhatsApp) y la lógica de tu asistente.
          </li>
          <li>
            <strong>Metadatos de Uso (Agregados y Anónimos):</strong> Podemos recopilar metadatos anónimos y agregados sobre el uso general del servicio (por ejemplo, número de asistentes creados, volumen de interacciones procesadas por la plataforma a nivel general, funciones más utilizadas). Estos datos se utilizan exclusivamente para mejorar la funcionalidad, el rendimiento y la seguridad de {APP_NAME}, y no contienen información personal identificable de tus usuarios finales ni el contenido de sus comunicaciones.
          </li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          2. Tus Responsabilidades y el Control de tus Datos
        </h2>
        <p className="mb-4">
          Tú eres el principal responsable de la gestión de los datos de tus usuarios finales y del cumplimiento de las normativas de privacidad aplicables:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Plataformas de Terceros:</strong> Los datos de las conversaciones y la información de tus contactos residen en las plataformas que utilizas (por ejemplo, WhatsApp, Facebook) y, si así lo configuras, en tus propias bases de datos (por ejemplo, Google Sheets). El manejo de esta información se rige por los términos de servicio y las políticas de privacidad de dichos proveedores (Meta, Google, etc.). {APP_NAME} no controla ni es responsable de las prácticas de privacidad de estos terceros.
          </li>
          <li>
            <strong>Cumplimiento Normativo:</strong> Eres responsable de asegurar que el uso que haces de {APP_NAME} y de tus asistentes de IA cumple con todas las leyes de protección de datos y privacidad aplicables en tu jurisdicción y en la de tus usuarios finales (por ejemplo, GDPR, CCPA, etc.). Esto incluye obtener los consentimientos necesarios de tus usuarios para procesar su información.
          </li>
          <li>
            <strong>Transparencia con tus Usuarios:</strong> Te recomendamos ser transparente con tus usuarios finales sobre cómo utilizas los asistentes de IA, qué información recopilas a través de ellos y cómo se maneja dicha información.
          </li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          3. Uso de la Información de Configuración
        </h2>
        <p className="mb-4">
          La información de configuración de tu cuenta y asistentes que almacenamos se utiliza exclusivamente para:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>Proporcionar, mantener y mejorar los servicios de {APP_NAME}.</li>
          <li>Gestionar tu cuenta y suscripción.</li>
          <li>Permitir el funcionamiento técnico de tus asistentes según tu configuración.</li>
          <li>Contactarte con información importante sobre tu cuenta o actualizaciones del servicio.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          4. Seguridad de la Información
        </h2>
        <p className="mb-4">
          Nos esforzamos por proteger la información de configuración de tu cuenta y de tus asistentes utilizando medidas de seguridad técnicas y organizativas razonables para prevenir el acceso no autorizado, la alteración, divulgación o destrucción. Sin embargo, ningún sistema de transmisión por Internet o de almacenamiento electrónico es 100% seguro.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          5. Integraciones con Servicios de Terceros
        </h2>
        <p className="mb-4">
          {APP_NAME} facilita la integración con servicios de terceros (como WhatsApp a través de Vonage, Google Sheets, etc.). Cuando habilitas estas integraciones:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            El intercambio de información entre {APP_NAME} y estos servicios se realiza según tu configuración y autorización.
          </li>
          <li>
            El tratamiento de tus datos por parte de estos terceros se rige por sus propias políticas de privacidad y términos de servicio. Te recomendamos revisarlos cuidadosamente.
          </li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          6. Privacidad de los Niños
        </h2>
        <p className="mb-4">
          Nuestros servicios no están dirigidos a personas menores de 13 años (o la edad mínima estipulada por la ley en la jurisdicción aplicable). No recopilamos de forma intencionada información personal de niños. Si tienes conocimiento de que un niño nos ha proporcionado información personal sin el consentimiento de sus padres, por favor contáctanos.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          7. Cambios a esta Política de Privacidad
        </h2>
        <p className="mb-4">
          Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o por otros motivos operativos, legales o regulatorios. Te notificaremos de cualquier cambio material publicando la nueva política en esta página y actualizando la fecha de "Última actualización" en la parte superior. Te recomendamos revisar esta política regularmente.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          8. Contacto
        </h2>
        <p className="mb-4">
          Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad o nuestras prácticas de manejo de datos, por favor contáctanos a través de los canales de soporte indicados en nuestra aplicación o sitio web.
        </p>
        <p className="text-sm text-muted-foreground mt-8">
          <em>
            Nota Importante: Esta política de privacidad está diseñada para ser informativa. {APP_NAME} te proporciona las herramientas para gestionar tus asistentes. La responsabilidad final sobre el cumplimiento de las leyes de protección de datos en el uso de estas herramientas recae sobre ti, el usuario de la plataforma. Te recomendamos consultar con un profesional legal para asegurar que tus prácticas cumplen con todas las regulaciones aplicables.
          </em>
        </p>
         <div className="mt-8 text-center">
            <Link href="/" className="text-primary hover:underline">
              Volver a la página principal
            </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default PrivacyPolicyPage;

    