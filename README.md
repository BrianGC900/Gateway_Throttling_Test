# Message Throtlling
Sistema asíncrono de alto rendimiento para el encolamiento, procesamiento y envío de mensajes. Diseñado con arquitectura basada en eventos, garantiza la entrega mediante colas persistentes, previene envíos duplicados (idempotencia) y controla el flujo de salida hacia proveedores externos (throttling/rate-limiting) para evitar bloqueos.

## Arquitectura y Tecnologías

* **API Gateway (Express.js):** Recibe las solicitudes de envío de forma asíncrona.
* **Message Broker (RabbitMQ):** Garantiza la persistencia y el encolamiento seguro.
* **Caché & Estado (Redis):** Maneja la idempotencia y funciona como base de datos de estado ultra-rápida.
* **Worker Pipeline:** Consumidor que extrae mensajes y los envía a la plataforma externa aplicando concurrencia controlada.
* **Mock Server:** Simula el comportamiento del proveedor final con un límite de peticiones estricto.

## Requisitos Previos
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (v18 o superior recomendado)
* [Docker](https://www.docker.com/) y Docker Compose (para levantar el stack completo)

---

## Guía de Inicio Rápido (Paso a Paso)

Sigue estos pasos en orden para levantar todo el ecosistema desde cero.

Abre tu terminal y ejecuta:

### 1. Clonar e Instalar

Para poner en marcha el sistema, sigue estos pasos en orden:

```bash
# 1. Clona el repositorio (reemplaza con tu URL)
git clone https://github.com/BrianGC900/Gateway_Throttling_Test.git

# 2. Entra al directorio del proyecto
cd message-throttling-prueba

# 3. Instala todas las dependencias
npm install
```
### 2. Configurar el Entorno

Crea un archivo `.env` en la raíz del proyecto y pega la siguiente configuración base:

```env
#CONFIG
PORT=3000
MOCK_PORT=4000
PLATFORM_C_URL=http://localhost:4000/api/external/send

#REDIS
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

#RABBITMQ
RABBITMQ_USER=admin
RABBITMQ_PASS=admin123
RABBITMQ_PORT=5672
RABBITMQ_UI_PORT=15672
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"
```
### 3. Levantar Infraestructura Base

Asegúrate de tener Docker abierto en tu computadora, abre una terminal en el proyecto copia y pega, da Enter:

```bash
docker-compose up -d
```

*(Espera unos segundos a que los contenedores arranquen. Puedes verificar RabbitMQ en `http://localhost:15672` con user/pass: admin/admin123)*

Ver los logs en tiempo real (Recomendado):

```bash
docker-compose logs -f
```
---

## Documentación de la API

**Tip para pruebas:** Puedes probar estos endpoints utilizando una herramienta gráfica como [Postman](https://www.postman.com/) o directamente desde tu terminal usando `cURL`.

---

### 1. Encolar Mensaje
**POST** `http://localhost:3000/api/send`

Agrega un mensaje a la cola para su procesamiento asíncrono, abre una nueva terminal y ejecuta:

**Ejemplo en Windows (PowerShell):**
```bash
$body = @{
  id = "msg_001"
  to = "+525500000000"
  content = "Contenido del mensaje de prueba"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/send" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

**Ejemplo en Linux / macOS / Git Bash (cURL):**
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "id": "msg_001",
    "to": "+525500000000",
    "content": "Contenido del mensaje de prueba"
  }'
```

* **Body (JSON): Copiar y pegar en postman: seleccionar Body -> dentro de raw, (Metodo POST -> url: http://localhost:3000/api/send)**
    ```json
    {
      "id": "msg_001",
      "to": "+525500000000",
      "content": "Contenido del mensaje de prueba"
    }
    ```
* **Respuestas:**
    * `202 Accepted`: Encolado con éxito.
    * `202 Accepted` (status: "ignored"): Mensaje duplicado, el `id` ya fue registrado.
    * `400 Bad Request`: Faltan campos requeridos.

---

### 2. Consultar Estado de Mensaje (Trazabilidad)
En Postman solo selecciona el metodo GET y pega la URL:
**GET** `http://localhost:3000/api/status/:id`

Obtiene el estado en tiempo real (`queued`, `processing`, `sent`, `retrying`, `failed`).

**Ejemplo de petición con Windows + PowerShell:**
```bash
Invoke-RestMethod -Uri "http://localhost:3000/api/status/msg_001" -Method GET
```

**Ejemplo de petición con cURL:**
```bash
curl http://localhost:3000/api/status/msg_001
```
---

## Pruebas (Testing)
Abre una **nueva terminal** y lanza las pruebas (asegurate de estar dentro de la carpeta)

### Pruebas Unitarias
Ejecuta la suite de pruebas unitarias de Jest para validar la lógica del Gateway (abre una nueva terminal y ejecuta):
```bash
npm test
```

### Prueba de Carga Masiva (Burst Test)
Para probar el límite del *throttling*:

```bash
npm run test:burst
```
Podrás observar cómo la API encola miles de mensajes en segundos, mientras que el Worker los dispara de modo seguro hacia el mock server.