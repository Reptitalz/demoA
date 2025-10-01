
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <PageContainer className="space-y-6" fullWidth={true}>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-gradient mb-6 text-center">
            Política de Privacidad de {APP_NAME}
          </h1>
        </header>

        <p className="mb-4 text-muted-foreground">
          Última actualización: 29 de Julio de 2024
        </p>

        <p className="mb-4">
          Bienvenido/a a {APP_NAME} ("nosotros", "nuestro"). Tu privacidad y la de los datos que gestionas a través de nuestra plataforma son de suma importancia para nosotros. Esta Política de Privacidad tiene como objetivo informarte sobre cómo manejamos la información en relación con el uso de nuestros servicios.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          1. Información que Recopilamos y Manejamos
        </h2>
        <p className="mb-4">
          {APP_NAME} como plataforma está diseñado para ser una herramienta que TÚ controlas. Para poder ofrecer nuestros servicios, recopilamos y almacenamos la siguiente información:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Datos de tu Cuenta:</strong> Cuando te registras, recopilamos tu nombre, dirección de correo electrónico y un identificador único para crear y gestionar tu cuenta.
          </li>
          <li>
            <strong>ID de Chat Personal:</strong> Generamos un "ID de chat" (o `chatPath`) único para tu perfil de usuario, que te permitirá comunicarte con otros usuarios en el futuro.
          </li>
          <li>
            <strong>Datos de Configuración de Asistentes:</strong> Almacenamos la configuración que defines para tus asistentes, como su nombre, el "prompt" (instrucciones), y la información de las bases de datos que vincules.
          </li>
          <li>
            <strong>Archivos Multimedia en Tránsito:</strong> Cuando un usuario envía un archivo (imagen, audio, video, etc.) a uno de tus asistentes, dicho archivo se convierte a un formato de texto (Data URL) en el dispositivo del usuario. Esta información se almacena temporalmente en el historial de chat local (en el navegador) y se envía a nuestros servicios para que tú, como propietario, puedas revisarla y autorizarla. No almacenamos estos archivos de forma permanente en nuestros servidores de archivos.
          </li>
          <li>
            <strong>No Recopilación del Contenido de Conversaciones de IA:</strong> {APP_NAME} NO almacena el contenido de las conversaciones que tus asistentes tienen con tus clientes. La transmisión y el procesamiento de estos mensajes son gestionados por la lógica de tu asistente y los servicios de IA subyacentes. El historial de chat que visualizas se guarda localmente en tu dispositivo.
          </li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          2. Cómo Usamos tu Información
        </h2>
        <p className="mb-4">
          La información que recopilamos se utiliza exclusivamente para:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>Proporcionar, mantener y mejorar los servicios de {APP_NAME}.</li>
          <li>Gestionar tu cuenta, incluyendo las recargas de créditos, suscripciones a planes y facturación.</li>
          <li>Permitir el funcionamiento técnico de tus asistentes según tu configuración.</li>
          <li>Contactarte con información importante sobre tu cuenta o actualizaciones del servicio.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          3. Pagos y Proveedores Externos
        </h2>
        <p className="mb-4">
          Para la compra de créditos y la suscripción a planes, utilizamos **Mercado Pago** como nuestro procesador de pagos. Nosotros no almacenamos los datos completos de tu tarjeta. Al realizar un pago, proporcionas tu información directamente a Mercado Pago, y su uso de tu información se rige por su propia política de privacidad.
        </p>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          4. Tus Responsabilidades y el Control de tus Datos
        </h2>
        <p className="mb-4">
          Tú eres el principal responsable de la gestión de los datos de tus clientes y del cumplimiento de las normativas de privacidad aplicables:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Datos en Plataformas de Terceros:</strong> Si conectas una Hoja de Google, el manejo de esa información se rige por los términos y políticas de Google.
          </li>
          <li>
            <strong>Cumplimiento Normativo:</strong> Eres responsable de asegurar que el uso que haces de {APP_NAME} cumple con todas las leyes de protección de datos aplicables en tu jurisdicción y en la de tus usuarios finales.
          </li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          5. Seguridad de la Información
        </h2>
        <p className="mb-4">
          Nos esforzamos por proteger la información de tu cuenta y de tus asistentes utilizando medidas de seguridad técnicas y organizativas razonables para prevenir el acceso no autorizado, la alteración, divulgación o destrucción.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          6. Cambios a esta Política de Privacidad
        </h2>
        <p className="mb-4">
          Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos de cualquier cambio material publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          7. Contacto
        </h2>
        <p className="mb-4">
          Si tienes alguna pregunta o inquietud sobre esta Política de Privacidad, por favor contáctanos a través de los canales de soporte indicados en nuestra aplicación o sitio web.
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
