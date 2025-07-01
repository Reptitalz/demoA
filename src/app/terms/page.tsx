import React from 'react';

const TermsPage: React.FC = () => {
  const APP_NAME = "{APP_NAME}"; // Placeholder for the actual app name

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de {APP_NAME}</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
        <p className="text-gray-700">Al acceder o utilizar la plataforma {APP_NAME} (el "Servicio"), aceptas cumplir con estos términos y condiciones (los "Términos"). Si no estás de acuerdo con estos Términos, no utilices el Servicio.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Uso del Servicio</h2>
        <p className="text-gray-700">El Servicio proporciona herramientas, incluyendo asistentes de inteligencia artificial, para ayudarte en diversas tareas. El uso del Servicio es bajo tu propio riesgo. No garantizamos la precisión, integridad o utilidad de ninguna información generada por los asistentes de IA.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. Privacidad</h2>
        <p className="text-gray-700">Podemos recopilar metadatos de uso agregados y anónimos para mejorar el Servicio. No recopilamos intencionalmente información de identificación personal a menos que se especifique lo contrario y sea necesario para proporcionar el Servicio. Consulta nuestra Política de Privacidad (si aplica) para más detalles sobre cómo manejamos la información.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Responsabilidades del Usuario</h2>
        <p className="text-gray-700">Eres responsable del uso que haces del Servicio y de cualquier contenido que generes o gestiones a través de él. Te recomendamos cumplir con las leyes y regulaciones aplicables en tu jurisdicción, incluyendo las leyes de protección de datos como GDPR y CCPA, al utilizar el Servicio y al interactuar con tus propios usuarios. Debes ser transparente con tus usuarios sobre cómo utilizas el Servicio.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Exención de Garantías</h2>
        <p className="text-gray-700">EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS. NO GARANTIZAMOS QUE EL SERVICIO SERÁ ININTERRUMPIDO, LIBRE DE ERRORES O SEGURO.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Limitación de Responsabilidad</h2>
        <p className="text-gray-700">EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, {APP_NAME} NO SERÁ RESPONSABLE POR NINGÚN DAÑO DIRECTO, INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE O EJEMPLAR, INCLUYENDO PERO NO LIMITADO A, DAÑOS POR PÉRDIDA DE GANANCIAS, DATOS U OTRAS PÉRDIDAS INTANGIBLES, QUE RESULTEN DEL USO O LA IMPOSIBILIDAD DE USAR EL SERVICIO.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Modificaciones a los Términos</h2>
        <p className="text-gray-700">Nos reservamos el derecho de modificar estos Términos en cualquier momento. Se te notificará sobre cualquier cambio publicando los nuevos Términos en esta página. Tu uso continuado del Servicio después de dichas modificaciones constituye tu aceptación de los nuevos Términos.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Contacto</h2>
        <p className="text-gray-700">Si tienes alguna pregunta sobre estos Términos, por favor contáctanos a través de los canales de soporte proporcionados en el Servicio.</p>
      </section>

      <p className="text-sm text-gray-500 mt-8">Este documento es una plantilla básica y debe ser revisado por un profesional legal.</p>
    </div>
  );
};

export default TermsPage;