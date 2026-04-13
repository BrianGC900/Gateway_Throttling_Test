import express from "express";
import dotenv from "dotenv";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { enqueueMessage, getMessageStatus } from "./src/services/gateway.service.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Endpoint para recibir mensajes de Plataforma A
app.post("/api/send", async (req, res) => {
  try {
    const result = await enqueueMessage(req.body);
    return res.status(202).json({ success: true, ...result });
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Endpoint de trazabilidad
app.get("/api/status/:id", async (req, res) => {
  try {
    const status = await getMessageStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ success: false, error: "Mensaje no encontrado" });
    }
    return res.json({ success: true, data: status });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

connectRabbitMQ().then(() => {
  app.listen(port, () => {
    console.log(`Gateway API corriendo en http://localhost:${port}`);
  });
});