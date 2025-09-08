import express from "express";
import { ENV } from "./config/env.config.js";
import { connectToMongoDB } from "./config/db.config.js";

const app = express();

app.listen(ENV.PORT, () => {
  connectToMongoDB()
  console.log(`Server running on http://localhost:${ENV.PORT}/`);
});
