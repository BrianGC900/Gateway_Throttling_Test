import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

const API_URL = `${URL}/api/send`;
const TOTAL_MESSAGES = 100000; // Cambia este número para probar con más o menos mensajes
const BATCH_SIZE = 5000;

const runBurstTest = async () => {
 console.log(`Iniciando ráfaga MASIVA: Enviando ${TOTAL_MESSAGES} mensajes...`);
  console.time("Tiempo de recepción");

  let enqueuedCount = 0;

  for (let i = 0; i < TOTAL_MESSAGES; i += BATCH_SIZE) {
    const batch = [];
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_MESSAGES - i);

    for (let j = 0; j < currentBatchSize; j++) {
      const messageNumber = i + j + 1;
      const payload = {
        id: `msg_massive_${Date.now()}_${messageNumber}`,
        to: `+525500${messageNumber.toString().padStart(6, '0')}`,
        content: `Campaña masiva #${messageNumber}`
      };

      const requestPromise = fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .catch(() => ({ success: false }));

      batch.push(requestPromise);
    }

    // Disparamos el lote de 5000 al mismo tiempo y esperamos a que la API responda
    const results = await Promise.all(batch);
    const successes = results.filter(r => r.success).length;
    enqueuedCount += successes;

    console.log(`Lote enviado... Progreso: ${enqueuedCount} / ${TOTAL_MESSAGES}`);
  }

  console.log(`\n¡Ráfaga completada!`);
  console.log(`Mensajes encolados con éxito: ${enqueuedCount} de ${TOTAL_MESSAGES}`);
  console.timeEnd("Tiempo de recepción"); 
  console.log(`El worker procesará esto a 100/s. Tardará aprox ${Math.ceil(TOTAL_MESSAGES / 100 / 60)} minutos en vaciar la cola.`);
};

runBurstTest();