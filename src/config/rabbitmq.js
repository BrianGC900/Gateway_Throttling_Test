import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue("outbound_messages", { durable: true });
    console.log("Conectado a RabbitMQ - Cola lista");
    return channel;
  } catch (error) {
    console.error(" Error conectando a RabbitMQ:", error);
    process.exit(1);
  }
};

export const getChannel = () => channel;