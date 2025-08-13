
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';

const TermsOfServicePage = () => {
  return (
    <PageContainer className="space-y-6" fullWidth={true}>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-gradient mb-6 text-center">
            Términos y Condiciones de Servicio de {APP_NAME}
          </h1>
        </header>

        <p className="mb-4 text-muted-foreground">
          Última actualización: 28 de Julio de 2024
        </p>
        
        <p className="mb-4">
          Bienvenido a {APP_NAME}. Estos Términos y Condiciones de Servicio ("Términos") rigen tu acceso y uso de nuestra plataforma, software y servicios (colectivamente, el "Servicio"). Al acceder o utilizar el Servicio, aceptas estar sujeto a estos Términos. Si no estás de acuerdo con estos Términos, no puedes acceder ni utilizar el Servicio.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">1. Cuentas de Usuario</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Registro:</strong> Debes registrarte para obtener una cuenta para acceder al Servicio, utilizando tu cuenta de Google. Aceptas que la información de tu perfil de Google (nombre, correo electrónico) se use para crear tu cuenta en {APP_NAME}.</li>
          <li><strong>Información de Facturación:</strong> Aceptas proporcionar y mantener información de facturación precisa y completa, incluyendo tu nombre legal y dirección, para procesar los pagos a través de Mercado Pago.</li>
          <li><strong>Seguridad:</strong> Eres responsable de la seguridad de tu cuenta de Google y de cualquier actividad o acción bajo tu cuenta de {APP_NAME}.</li>
          <li><strong>Edad Mínima:</strong> Debes tener al menos 18 años para utilizar el Servicio.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">2. Uso del Servicio</h2>
        <p className="mb-4">
          Te otorgamos una licencia limitada, no exclusiva, intransferible y revocable para utilizar el Servicio para tus fines comerciales internos, sujeto a estos Términos.
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Uso Aceptable:</strong> No utilizarás el Servicio para ningún propósito ilegal o no autorizado. Aceptas cumplir con todas las leyes aplicables, incluidas las de protección de datos y privacidad.</li>
          <li><strong>Contenido y Responsabilidad:</strong> Eres el único responsable de todo el contenido que configuras en tus asistentes (prompts) y de los datos que conectas (por ejemplo, a través de Hojas de Google). {APP_NAME} es una herramienta; tú eres el responsable final del comportamiento de tu asistente y de cómo interactúa con tus clientes.</li>
          <li><strong>Vinculación de Números de WhatsApp:</strong> Aceptas que solo utilizarás números de teléfono de tu propiedad y que no tengan una cuenta de WhatsApp activa (personal o de negocios) para vincularlos a los asistentes. El mal uso de este servicio puede resultar en la suspensión de tu cuenta.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">3. Datos y Privacidad</h2>
        <p className="mb-4">
          Nuestra <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link> describe cómo manejamos la información que recopilamos. Al utilizar el Servicio, aceptas que podemos utilizar dicha información de acuerdo con nuestra Política de Privacidad. Tú eres el controlador de los datos de tus clientes, y {APP_NAME} actúa como un procesador de datos en tu nombre.
        </p>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">4. Tarifas y Pago</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Sistema de Créditos:</strong> El Servicio opera con un sistema de créditos de pago por uso. Debes comprar créditos para utilizar las funciones de los asistentes.</li>
          <li><strong>Procesador de Pagos:</strong> Todos los pagos se procesan a través de Mercado Pago. Al realizar una compra, aceptas sus términos y condiciones.</li>
          <li><strong>No Reembolsable:</strong> Los créditos comprados no son reembolsables y no tienen valor monetario fuera del Servicio. Los créditos no utilizados no caducan mientras tu cuenta permanezca activa.</li>
          <li><strong>Cambios de Precios:</strong> Nos reservamos el derecho de cambiar los precios de los créditos en cualquier momento. Se te notificará de cualquier cambio de precio con antelación razonable.</li>
        </ul>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">5. Propiedad Intelectual</h2>
        <p className="mb-4">
          El Servicio y su contenido original (excluyendo tu contenido) son propiedad de {APP_NAME}. Tu contenido (prompts, datos de Hojas de Google, etc.) sigue siendo de tu propiedad.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">6. Terminación</h2>
        <p className="mb-4">
          Podemos suspender o terminar tu acceso al Servicio de inmediato, sin previo aviso, por cualquier motivo, incluido el incumplimiento de estos Términos. Tras la terminación, tu derecho a utilizar el Servicio cesará y los créditos restantes se perderán.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">7. Renuncia de Garantías y Limitación de Responsabilidad</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>El Servicio se proporciona "TAL CUAL". No garantizamos que el servicio será ininterrumpido o libre de errores.</li>
          <li>En la máxima medida permitida por la ley, {APP_NAME} no será responsable de ningún daño indirecto, incidental o consecuente resultante de tu uso del Servicio.</li>
          <li>Reconoces que las respuestas generadas por los asistentes de IA pueden no ser siempre precisas y que eres responsable de verificar la información crítica.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">8. Cambios a los Términos</h2>
        <p className="mb-4">
          Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso con al menos 30 días de antelación.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">9. Contacto</h2>
        <p className="mb-4">
          Si tienes alguna pregunta sobre estos Términos, contáctanos a través de los canales de soporte proporcionados en nuestra página principal.
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

export default TermsOfServicePage;
