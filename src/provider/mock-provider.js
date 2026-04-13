import express from "express";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.MOCK_PORT || 4000;

app.use(express.json());

const strictLimiter = rateLimit({
  windowMs: 1000, 
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ 
      error: "Too Many Requests - Rate limit exceeded strict 100/s" 
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/external/send", strictLimiter, (req, res) => {
  setTimeout(() => {
    res.status(200).json({ success: true, message: "Recibido por Plataforma C" });
  }, 30);
});

app.listen(port, () => {
  console.log(`Mock Plataforma C corriendo en http://localhost:${port}`);
  console.log(`Límite configurado: 100 peticiones / segundo`);
});