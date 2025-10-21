### Lógica Requerida para el Servidor de Backend (Socket.IO)

Este documento describe la arquitectura y los eventos necesarios que el servidor de backend, construido con Socket.IO, debe implementar para soportar la funcionalidad de chat en tiempo real, estado de presencia y señalización de llamadas de la aplicación Hey Manito!.

---

#### **1. Gestión de Conexiones y Autenticación**

El servidor debe manejar las conexiones de los clientes, identificarlos y unirlos a salas privadas para la comunicación.

*   **Evento de Conexión (`on 'connection'`)**:
    *   Al recibir una nueva conexión, el servidor debe leer el `userId` (que es el `chatPath` del usuario) de los queries de la conexión (`socket.handshake.query.userId`).
    *   **Unirse a una Sala Privada**: El socket del usuario debe unirse a una sala con el mismo nombre que su `chatPath`. Esto es fundamental para la mensajería privada.
        ```javascript
        const chatPath = socket.handshake.query.userId;
        if (chatPath) {
          socket.join(chatPath);
        }
        ```
    *   **Gestión de Presencia**: El servidor debe mantener una lista o un objeto de usuarios en línea (ej. `onlineUsers[chatPath] = socket.id`).
    *   **Notificar Conexión**: Al conectarse un usuario, el servidor debe emitir un evento `contact_online` a todas las demás salas/usuarios, enviando el `chatPath` del usuario que se acaba de conectar.
        ```javascript
        socket.broadcast.emit('contact_online', chatPath);
        ```
    *   **Enviar Lista de Usuarios en Línea**: Al nuevo usuario conectado, se le debe enviar la lista completa de usuarios actualmente en línea.
        ```javascript
        socket.emit('online_users', onlineUsers);
        ```

*   **Evento de Desconexión (`on 'disconnect'`)**:
    *   Cuando un usuario se desconecta, el servidor debe eliminarlo de la lista de `onlineUsers`.
    *   Debe emitir un evento `contact_offline` a todos los demás usuarios para que puedan actualizar su estado de presencia.
        ```javascript
        socket.broadcast.emit('contact_offline', chatPath);
        ```

---

#### **2. Manejo de Mensajes de Chat**

El núcleo de la funcionalidad de chat se basa en la redirección de mensajes entre usuarios.

*   **Escuchar Mensajes Nuevos (`on 'sendMessage'`)**:
    *   El servidor debe escuchar un evento `sendMessage`. Este evento llevará un payload con la siguiente estructura: `{ id, senderChatPath, recipientChatPath, content, senderProfile }`.
    *   **Lógica de Redirección**: El servidor debe usar el `recipientChatPath` del payload para enviar el mensaje a la sala correcta.
        ```javascript
        socket.to(recipientChatPath).emit('receiveMessage', {
          id,
          senderChatPath,
          recipientChatPath,
          content,
          senderProfile
        });
        ```
    *   **Confirmación de Entrega (Acknowledgement)**: Después de emitir el `receiveMessage`, el servidor debe enviar una confirmación (`ack`) de vuelta al remitente para notificarle que el mensaje fue procesado por el servidor.
        
---

#### **3. Gestión de Confirmaciones de Lectura**

Para una experiencia de chat completa, el servidor debe manejar los estados de "entregado" y "leído".

*   **Escuchar `markAsRead`**:
    *   Cuando un usuario abre un chat, el cliente emite un evento `markAsRead` con `{ senderChatPath, recipientChatPath }`.
    *   El servidor debe redirigir este evento al `senderChatPath` original para notificarle que sus mensajes han sido leídos por el destinatario (`recipientChatPath`).
        ```javascript
        socket.to(senderChatPath).emit('messagesRead', { senderChatPath: recipientChatPath });
        ```

---

#### **4. Señalización para Llamadas WebRTC (LiveKit)**

El servidor de Socket.IO actúa como intermediario (señalizador) para iniciar llamadas antes de que la comunicación pase a LiveKit.

*   **Escuchar Inicio de Llamada (`on 'initiateCall'`)**:
    *   El cliente emite este evento con un payload: `{ recipientId, callerId, callerInfo, roomName }`.
    *   El servidor debe reenviar esta información al `recipientId` emitiendo un evento `incomingCall`.
        ```javascript
        socket.to(recipientId).emit('incomingCall', {
          roomName,
          callerId,
          callerInfo
        });
        ```

*   **Escuchar Rechazo de Llamada (`on 'rejectCall'`)**:
    *   Si el destinatario rechaza la llamada, el cliente emite `rejectCall` con `{ callerId, recipientId }`.
    *   El servidor debe notificar al usuario que inició la llamada (`callerId`) que su llamada fue rechazada.
        ```javascript
        socket.to(callerId).emit('callRejected', { recipientId });
        ```

*   **Escuchar Aceptación de Llamada (`on 'acceptCall'`)**:
    *   Cuando se acepta la llamada, el cliente receptor emite `acceptCall` con `{ callerId, roomName }`.
    *   El servidor notifica al llamador original que la llamada fue aceptada.
        ```javascript
        socket.to(callerId).emit('callAccepted', { roomName });
        ```
