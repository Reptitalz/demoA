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
          Última actualización: 28 de Julio de 2024
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
          Te otorgamos una licencia limitada, no exclusiva, intransferible y revocable para utilizar el Servicio para tus fines comerciales internos, sujeto a estos Términos.
        </p>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Uso Aceptable:</strong> No utilizarás el Servicio para ningún propósito ilegal o no autorizado. Aceptas cumplir con todas las leyes, normas y regulaciones aplicables, incluidas las relacionadas con la protección de datos y la privacidad (como GDPR, CCPA, etc.).</li>
          <li><strong>Contenido del Usuario:</strong> Eres el único responsable de todo el contenido, datos e información que ingresas, configuras o transmites a través del Servicio ("Contenido del Usuario"), incluidos los prompts de los asistentes y los datos en las bases de datos vinculadas.</li>
          <li><strong>Prohibiciones:</strong> Aceptas no realizar ninguna de las siguientes acciones: (a) realizar ingeniería inversa, descompilar o intentar descubrir el código fuente del Servicio; (b) utilizar el Servicio de manera que pueda dañar, deshabilitar o sobrecargar nuestros servidores o redes; (c) transmitir virus, gusanos o cualquier código de naturaleza destructiva.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">3. Datos y Privacidad</h2>
        <p className="mb-4">
          Nuestra <Link href="/privacy" className="text-primary hover:underline">Política de Privacidad</Link> describe cómo manejamos la información que nos proporcionas. Al utilizar el Servicio, aceptas que podemos utilizar dicha información de acuerdo con nuestra Política de Privacidad. Eres el controlador de los datos de tus clientes y usuarios finales. {APP_NAME} actúa como procesador de datos en tu nombre.
        </p>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">4. Tarifas y Pago</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li><strong>Créditos:</strong> El Servicio opera con un sistema de créditos de pago por uso. Debes comprar créditos para utilizar las funciones de los asistentes. Las tarifas de los paquetes de créditos se presentan en la aplicación.</li>
          <li><strong>No Reembolsable:</strong> Los créditos comprados no son reembolsables y no tienen valor monetario fuera del Servicio.</li>
          <li><strong>Cambios de Precios:</strong> Nos reservamos el derecho de cambiar los precios de los créditos en cualquier momento. Se te notificará de cualquier cambio de precio con antelación.</li>
        </ul>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">5. Propiedad Intelectual</h2>
        <p className="mb-4">
          El Servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de {APP_NAME} y sus licenciantes. Tu Contenido de Usuario sigue siendo tu propiedad.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">6. Terminación</h2>
        <p className="mb-4">
          Podemos suspender o terminar tu acceso al Servicio de inmediato, sin previo aviso ni responsabilidad, por cualquier motivo, incluido el incumplimiento de estos Términos. Tras la terminación, tu derecho a utilizar el Servicio cesará inmediatamente.
        </p>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">7. Limitación de Responsabilidad y Renuncia de Garantías</h2>
        <ul className="list-disc list-inside mb-4 space-y-2 pl-4">
          <li>El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías de ningún tipo.</li>
          <li>En ningún caso {APP_NAME}, ni sus directores, empleados o socios, serán responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo resultante de tu acceso o uso del Servicio.</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mt-6 mb-3">8. Cambios a los Términos</h2>
        <p className="mb-4">
          Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, proporcionaremos un aviso con al menos 30 días de antelación.
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
