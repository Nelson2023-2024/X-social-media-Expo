import mongoose from "mongoose";
import { ENV } from "./env.config.js";
export const connectToMongoDB = async () => {
  console.log(ENV.MONGO_URI);
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log("Connected to database MongoDB successfully");
  } catch (error) {
    console.log("Error connecting to mongoDB", error.message);
    process.exit(1);
  }
};
