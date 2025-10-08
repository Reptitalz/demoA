### Prompt para el Desarrollo del Backend Ideal para Hey Manito!

**Rol:** Eres un arquitecto de software experto en la construcción de sistemas de backend escalables y en tiempo real, con especialización en Next.js, WebRTC (LiveKit) y MongoDB.

**Contexto del Proyecto:**
Estás trabajando en "Hey Manito!", una aplicación web construida con Next.js que funciona como una red social de chat con asistentes de IA. La aplicación ya cuenta con un frontend funcional para la gestión de perfiles, asistentes y una interfaz de chat, pero necesita un backend robusto para habilitar funcionalidades en tiempo real, principalmente llamadas de voz y video.

**Arquitectura Existente:**
*   **Frontend:** Next.js con React, ShadCN UI, Tailwind CSS.
*   **Backend (parcial):** API Routes de Next.js para operaciones CRUD.
*   **Base de Datos:** MongoDB.
*   **Autenticación:** NextAuth.js (Google y credenciales).
*   **Notificaciones Push:** `web-push` (configuración básica existente).

**Objetivo Principal:**
Diseñar e implementar la infraestructura de backend necesaria para habilitar **llamadas de voz y videollamadas en tiempo real** entre los usuarios de la plataforma, utilizando **LiveKit** como la solución WebRTC. Además, se deben mejorar los mecanismos de comunicación en tiempo real en general.

---

### Requerimientos Detallados del Backend:

**1. Módulo de Comunicación en Tiempo Real (LiveKit)**

*   **Infraestructura del Servidor LiveKit:**
    *   Define los pasos para desplegar una instancia del servidor de LiveKit. Puede ser auto-alojado (ej. en un VPS o contenedor Docker) o utilizando LiveKit Cloud. El objetivo es tener un endpoint de servidor LiveKit (`LIVEKIT_URL`) disponible.

*   **Servidor de Tokens de Acceso (API Route en Next.js):**
    *   Crea un nuevo endpoint seguro en Next.js, por ejemplo: `/api/livekit/get-token`.
    *   Este endpoint debe utilizar el SDK de servidor de LiveKit (`livekit-server-sdk`).
    *   Debe recibir el `roomName` (nombre de la sala) y la `identity` (identidad del participante) como parámetros.
    *   Debe validar que el usuario que solicita el token está autenticado y tiene permiso para unirse a esa sala.
    *   Utilizando las credenciales seguras del servidor (`LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`), debe generar un token de acceso (JWT) con los permisos adecuados (ej. unirse a la sala, publicar audio/video).
    *   Debe devolver el token generado al cliente en formato JSON.

**2. Flujo de Llamada y Señalización**

*   **Inicio de Llamada:**
    *   Cuando un usuario (Llamador) inicia una llamada a otro (Receptor), el frontend debe notificar al backend.
    *   Diseña un endpoint (ej. `/api/calls/initiate`) que reciba la identidad del receptor.

*   **Notificación de Llamada Entrante:**
    *   Al recibir la solicitud de inicio de llamada, el backend debe usar el servicio de notificaciones push (`web-push`) para enviar una notificación al dispositivo del receptor.
    *   La notificación debe contener la información de la llamada (quién llama, tipo de llamada) y el nombre de la sala para que el receptor pueda unirse.

*   **Rechazar/Aceptar Llamada:**
    *   Si el receptor rechaza la llamada, se debe notificar al llamador (puede ser a través de un evento de WebSocket o una notificación push).
    *   Si el receptor acepta, su cliente solicitará su propio token de acceso al endpoint `/api/livekit/get-token` para unirse a la sala de LiveKit.

**3. Mejora de la Comunicación en Tiempo Real (Alternativa al Polling)**

*   **Reemplazo del Polling de Eventos:** El sistema actual consulta `/api/events` periódicamente. Esto debe ser reemplazado por una solución más eficiente.
*   **Integración de WebSockets (Socket.IO):**
    *   Implementa un servidor de Socket.IO que se ejecute junto al servidor de Next.js.
    *   Crea eventos para notificar a los clientes sobre:
        *   Nuevos mensajes en un chat.
        *   Estado de la llamada (sonando, conectado, finalizado).
        *   Presencia de usuario (en línea, escribiendo...).
    *   El cliente debe establecer una conexión de WebSocket al iniciar sesión y unirse a las salas correspondientes a sus chats.

**4. Seguridad y Variables de Entorno**

*   Todas las claves secretas (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `VAPID_PRIVATE_KEY`, etc.) deben ser gestionadas exclusivamente a través de variables de entorno en el servidor y nunca deben ser expuestas al cliente.
*   El endpoint `/api/livekit/get-token` debe estar protegido y solo accesible para usuarios autenticados.

**Entregables:**
1.  **Código para la API Route de generación de tokens de LiveKit.**
2.  **Código para el endpoint de inicio de llamada que dispara las notificaciones push.**
3.  **Guía de configuración para el servidor de LiveKit.**
4.  **(Opcional pero recomendado) Código para un servidor básico de WebSockets y su integración con el frontend.**
