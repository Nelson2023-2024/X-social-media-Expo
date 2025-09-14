import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./config/env.config.js";
import { connectToMongoDB } from "./config/db.config.js";
import { userRoutes } from "./routes/user.route.js";
import { notificationRoutes } from "./routes/notification.route.js";
import { postRoutes } from "./routes/post.route.js";
import { commentRoutes } from "./routes/comment.route.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());
app.use(arcjetMiddleware);

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comment", commentRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal server error " });
});

app.listen(ENV.PORT, () => {
  connectToMongoDB();
  console.log(`Server running on http://localhost:${ENV.PORT}/`);
});
