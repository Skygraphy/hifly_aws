import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import uploadRouter from "./routes/upload.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json({ limit: "1kb" }));

app.use("/api/upload", uploadRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
