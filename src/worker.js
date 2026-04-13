import dotenv from "dotenv";
dotenv.config();

import { connectRabbitMQ } from "./config/rabbitmq.js";
import redis from "./config/redis.js";
import axios from "axios";
import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
  minTime: 12, 
  maxConcurrent: 50 
});

const EXTERNAL_URL = process.env.PLATFORM_C_URL;

const startWorker = async () => {
  const channel = await connectRabbitMQ();
  
  channel.prefetch(100); 
  console.log("Worker iniciado. Aplicando throttling hacia Plataforma C...");

  channel.consume("outbound_messages", async (msg) => {
    if (!msg) return;
    
    const data = JSON.parse(msg.content.toString());
    
    try {
      await redis.set(`msg:${data.id}:state`, "processing");

      await limiter.schedule(() => axios.post(EXTERNAL_URL, data));
      
      console.log(`[ENTREGADO] Msg: ${data.id}`);
      await redis.set(`msg:${data.id}:state`, "sent");
      
      channel.ack(msg);

    } catch (error) {
      // Manejo de rechazos por Rate Limit (Plataforma C se saturó)
      if (error.response && error.response.status === 429) {
        console.warn(`[RATE LIMIT] Plataforma C rechazó ${data.id}. Reintentando...`);
        await redis.set(`msg:${data.id}:state`, "retrying");
        
        setTimeout(() => channel.nack(msg, false, true), 2000);
      } else {
        console.error(`[FALLO FATAL] Msg: ${data.id} - ${error.message}`);
        await redis.set(`msg:${data.id}:state`, "failed");
        
        // Hacemos ACK 
        channel.ack(msg); 
      }
    }
  });
};

startWorker();