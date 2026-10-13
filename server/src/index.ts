import "dotenv/config";
import cors from "cors";
import express from "express";
import { recipesRouter } from "./routes/recipes.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/recipes", recipesRouter);

app.listen(port, () => {
  console.log(`Recipe API listening on http://localhost:${port}`);
});
