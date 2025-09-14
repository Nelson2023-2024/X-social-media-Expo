import { Router } from "express";
import asyncHandler from "express-async-handler";
import Post from "../models/Post.model.js";
import User from "../models/User.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

//public routes

//getting all posts
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username firstName lastName profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username firstName lastName profilePicture",
        },
      });

    res.status(200).json({ posts });
  })
);

//get a single post
router.get(
  "/:postId",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const posts = await Post.findById(postId)
      .sort({ createdAt: -1 })
      .populate("user", "username firstName lastName profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username firstName lastName profilePicture",
        },
      });

    res.status(200).json({ posts });
  })
);

//get user posts depending on the username
router.get(
  "/user/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await User.find({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "username firstName lastName profilePicture")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username firstName lastName profilePicture",
        },
      });

    res.status(200).json({ posts });
  })
);

export { router as postRoutes };
