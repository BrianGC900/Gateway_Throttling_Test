import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Conectado a Redis");
});

redis.on("error", (err) => {
  console.error("Error conectando a Redis:", err);
});

export default redis;