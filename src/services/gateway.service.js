import { getChannel } from "../config/rabbitmq.js";
import redis from "../config/redis.js";

export const enqueueMessage = async ({ id, to, content }) => {
  if (!id || !to || !content) {
    throw new Error("Faltan campos requeridos: id, to, content");
  }

  // Verificar si el ID ya existe en Redis
  const isNew = await redis.setnx(`msg:${id}:state`, "queued");
  
  if (isNew === 0) {
    return { status: "ignored", message: "Mensaje duplicado. Ya fue procesado o está en cola." };
  }

  // Guardar metadatos
  await redis.hset(`msg:${id}:data`, { to, content, enqueued_at: Date.now() });

  const channel = getChannel();
  const payload = JSON.stringify({ id, to, content });

  // Enviar a la cola como persistente
  channel.sendToQueue("outbound_messages", Buffer.from(payload), { persistent: true });
  
  return { status: "queued", id, message: "Aceptado asíncronamente" };
};

export const getMessageStatus = async (id) => {
  const state = await redis.get(`msg:${id}:state`);
  if (!state) return null;

  const data = await redis.hgetall(`msg:${id}:data`);
  return { id, state, ...data };
};