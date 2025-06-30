
"use client";

import PageContainer from '@/components/layout/PageContainer';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';

const TermsOfServicePage = () => {
  return (
    <PageContainer className="space-y-6" fullWidth={true}>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-gradient mb-6 text-center">
          Términos y Condiciones de Servicio de {APP_NAME}
        </h1>

        <p className="mb-4 text-muted-foreground">
          Última actualización: 29 de Julio de 2024
        </p>
        
        <p className="mb-4">
          Bienvenido a {APP_NAME}. Estos Términos y Condiciones de Servicio ("Términos") rigen tu acceso y uso de nuestra plataforma, software y servicios (colectivamente, el "Servicio"). Al acceder o utilizar el Servicio, aceptas estar sujeto a estos Términos. Si no estás de acuerdo con estos Términos, no puedes acceder ni utilizar el Servicio.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">1. Cuentas de Usuario</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Registro:</strong> Debes registrarte para obtener una cuenta para acceder al Servicio. Aceptas proporcionar información precisa, actual y completa durante el proceso de registro y mantenerla actualizada.</li>
          <li><strong>Seguridad:</strong> Eres responsable de salvaguardar tu contraseña y de cualquier actividad o acción bajo tu cuenta. Notifícanos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</li>
          <li><strong>Edad Mínima:</strong> Debes tener al menos 18 años para utilizar el Servicio.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">2. Uso del Servicio</h2>
        <p className="mb-4">
          Te otorgamos una licencia limitada, no exclusiva, intransferible y revocable para utilizar el Servicio para tus fines personales o comerciales internos, sujeto a estos Términos.
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Uso Aceptable:</strong> No utilizarás el Servicio para ningún propósito ilegal, no autorizado o que infrinja los derechos de terceros. Aceptas cumplir con todas las leyes, normas y regulaciones aplicables, incluidas las relacionadas con la protección de datos, la privacidad y las comunicaciones electrónicas (como GDPR, CCPA, etc.).</li>
          <li><strong>Contenido y Responsabilidad del Usuario:</strong> Eres el único responsable de todo el contenido, datos e información que ingresas, configuras o transmites a través del Servicio ("Contenido del Usuario"). Esto incluye los prompts de los asistentes, los datos en las bases de datos vinculadas y las interacciones que tus asistentes tienen con los usuarios finales. {APP_NAME} es una herramienta; tú eres el controlador y responsable final del comportamiento de tu asistente.</li>
          <li><strong>Prohibiciones:</strong> Aceptas no realizar ninguna de las siguientes acciones: (a) realizar ingeniería inversa, descompilar o intentar descubrir el código fuente del Servicio; (b) utilizar el Servicio de manera que pueda dañar, deshabilitar o sobrecargar nuestros servidores o redes; (c) transmitir virus, gusanos o cualquier código de naturaleza destructiva; (d) utilizar el Servicio para enviar spam o comunicaciones no solicitadas.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">3. Datos y Privacidad</h2>
        <p className="mb-4">
          Nuestra <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link> describe cómo manejamos la información que nos proporcionas al registrarte y configurar tu cuenta. Al utilizar el Servicio, aceptas que podemos utilizar dicha información de acuerdo con nuestra Política de Privacidad. Tú eres el controlador de los datos de tus clientes y usuarios finales, y {APP_NAME} actúa como un procesador de datos en tu nombre, proporcionando la plataforma tecnológica.
        </p>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">4. Tarifas y Pago</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Créditos:</strong> El Servicio opera con un sistema de créditos de pago por uso. Debes comprar créditos para utilizar las funciones de los asistentes. Las tarifas de los paquetes de créditos se presentan claramente en la aplicación antes de la compra.</li>
          <li><strong>No Reembolsable:</strong> Los créditos comprados no son reembolsables y no tienen valor monetario fuera del Servicio. Los créditos no utilizados no caducan mientras tu cuenta permanezca activa.</li>
          <li><strong>Cambios de Precios:</strong> Nos reservamos el derecho de cambiar los precios de los créditos en cualquier momento. Se te notificará de cualquier cambio de precio con antelación razonable.</li>
        </ul>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">5. Propiedad Intelectual</h2>
        <p className="mb-4">
          El Servicio y su contenido original (excluyendo tu Contenido de Usuario), características y funcionalidad son y seguirán siendo propiedad exclusiva de {APP_NAME} y sus licenciantes. Por otro lado, todo tu Contenido de Usuario, como tus prompts y los datos que conectas, sigue siendo de tu propiedad.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">6. Terminación</h2>
        <p className="mb-4">
          Podemos suspender o terminar tu acceso al Servicio de inmediato, sin previo aviso ni responsabilidad, por cualquier motivo, incluido el incumplimiento de estos Términos. Tras la terminación, tu derecho a utilizar el Servicio cesará inmediatamente y los créditos restantes se perderán.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">7. Renuncia de Garantías y Limitación de Responsabilidad</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD". No garantizamos que el servicio será ininterrumpido, seguro o libre de errores.</li>
          <li>En la máxima medida permitida por la ley, en ningún caso {APP_NAME}, ni sus directores, empleados o socios, serán responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo resultante de tu acceso o uso del Servicio.</li>
          <li>Reconoces que las respuestas generadas por los asistentes de IA pueden no ser siempre precisas y que eres responsable de verificar la información crítica.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">8. Cambios a los Términos</h2>
        <p className="mb-4">
          Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso con al menos 30 días de antelación antes de que los nuevos términos entren en vigor.
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
