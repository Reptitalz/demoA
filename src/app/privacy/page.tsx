
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <PageContainer className="space-y-6" fullWidth={true}>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-gradient mb-6 text-center">
          Política de Privacidad de {APP_NAME}
        </h1>

        <p className="mb-4 text-muted-foreground">
          Última actualización: 28 de Julio de 2024
        </p>

        <p className="mb-4">
          Bienvenido/a a {APP_NAME} ("nosotros", "nuestro"). Tu privacidad y la de los datos que gestionas a través de nuestra plataforma son de suma importancia para nosotros. Esta Política de Privacidad tiene como objetivo informarte sobre cómo manejamos la información en relación con el uso de nuestros servicios, incluyendo la interacción con tus asistentes de Inteligencia Artificial (IA) y las plataformas de WhatsApp y Facebook.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          1. Información que Recopilamos y Manejamos
        </h2>
        <p className="mb-4">
          {APP_NAME} como plataforma está diseñado para ser una herramienta que TÚ controlas. Para poder ofrecer nuestros servicios, recopilamos y almacenamos la siguiente información:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Datos de tu Cuenta:</strong> Cuando te registras utilizando Google, recopilamos tu nombre, dirección de correo electrónico y tu identificador único de Firebase (Firebase UID) para crear y gestionar tu cuenta.
          </li>
          <li>
            <strong>Datos de Contacto y Facturación:</strong> Para procesar los pagos de créditos, te solicitamos que proporciones tu nombre, apellidos y, opcionalmente, tu dirección de facturación. Esta información es necesaria para nuestros proveedores de pago y para cumplir con las normativas fiscales.
          </li>
           <li>
            <strong>Datos de Configuración de Asistentes:</strong> Almacenamos la configuración que defines para cada uno de tus asistentes. Esto incluye el nombre del asistente, el prompt (las instrucciones de comportamiento), los propósitos que has seleccionado, y la información de las bases de datos que vincules (como la URL y las columnas seleccionadas de una Hoja de Google).
          </li>
           <li>
            <strong>Número de Teléfono Vinculado:</strong> Guardamos el número de teléfono que vinculas a cada asistente para permitir la comunicación a través de WhatsApp. Este número se utiliza exclusivamente para el funcionamiento del asistente que has configurado.
          </li>
          <li>
            <strong>No Recopilación del Contenido de Conversaciones:</strong> {APP_NAME} NO recopila, almacena, ni monitorea activamente el contenido de las conversaciones que tus asistentes tienen con tus clientes a través de WhatsApp. La transmisión de mensajes es gestionada por proveedores externos y la lógica de tu asistente.
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
          <li>Gestionar tu cuenta, incluyendo las recargas de créditos y la facturación.</li>
          <li>Permitir el funcionamiento técnico de tus asistentes según tu configuración.</li>
          <li>Contactarte con información importante sobre tu cuenta, actualizaciones del servicio o notificaciones de seguridad.</li>
          <li>Enviar notificaciones a tu número de WhatsApp personal si has habilitado esa función para uno de tus asistentes.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          3. Pagos y Proveedores Externos
        </h2>
        <p className="mb-4">
          Para la recarga de créditos, utilizamos **Mercado Pago** como nuestro procesador de pagos. Nosotros no almacenamos los datos completos de tu tarjeta de crédito o débito. Al realizar un pago, proporcionas tu información directamente a Mercado Pago, y su uso de tu información personal se rige por su propia política de privacidad. Solo recibimos una confirmación del pago, tu nombre, correo y la información de facturación que proporcionaste para generar las órdenes de pago.
        </p>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">
          4. Tus Responsabilidades y el Control de tus Datos
        </h2>
        <p className="mb-4">
          Tú eres el principal responsable de la gestión de los datos de tus usuarios finales y del cumplimiento de las normativas de privacidad aplicables:
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>
            <strong>Plataformas de Terceros:</strong> Los datos de las conversaciones y la información de tus contactos residen en las plataformas que utilizas (por ejemplo, WhatsApp) y, si así lo configuras, en tus propias bases de datos (por ejemplo, Google Sheets). El manejo de esta información se rige por los términos de servicio y las políticas de privacidad de dichos proveedores (Meta, Google, etc.).
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
