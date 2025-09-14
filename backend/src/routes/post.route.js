import { Router } from "express";
import asyncHandler from "express-async-handler";
import Post from "../models/Post.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import Comment from "../models/Comment.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.config.js";
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

//PROTECTED ROUTES
router.use(protectRoute);

//creating a post
router.post(
  "/",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { content } = req.body;
    const imageFile = req.file;

    if (!content && !imageFile)
      return res
        .status(400)
        .json({ error: "Post must contain either text or image" });

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    let imageUrl = "";

    // upload image to Cloudinary if provided
    if (imageFile) {
      try {
        // convert buffer to base64 for cloudinary
        const base64Image = `data:${
          imageFile.mimetype
        };base64,${imageFile.buffer.toString("base64")}`;

        const uploadResponse = await cloudinary.uploader.upload(base64Image, {
          folder: "social_media_posts_X",
          resource_type: "image",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" },
            { format: "auto" },
          ],
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(400).json({ error: "Failed to upload image" });
      }

      const post = await Post.create({
        user: user._id,
        content: content || "",
        image: imageUrl,
      });

      res.status(201).json({ post });
    }
  })
);

router.post(
  "/:postId/like",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { postId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    const post = await Post.findById(postId);

    if (!user || !post)
      return res.status(404).json({ error: "User or post not found" });

    const isLiked = post.likes.includes(user._id);

    if (isLiked) {
      //unlike
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: user._id },
      });
    } else {
      //like
      await Post.findByIdAndUpdate(postId, {
        $push: { likes: user._id },
      });

      //create notification if not liking own post
      if (post.user.toString() !== user._id.toString()) {
        await Notification.create({
          from: user._id,
          to: post.user,
          type: "like",
          post: postId,
        });
      }

      res.status(200).json({
        message: isLiked
          ? "Post unliked successfully"
          : "Post liked succesfully",
      });
    }
  })
);

//delete post
router.delete(
  "/:postId",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { postId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    const post = await Post.findById(postId);

    if (!userId || !postId)
      return res.status(404).json({ error: "User or post not found " });

    if (post.user.toString() !== user._id.toString())
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });

    //delete all comments from the deleted post
    await Comment.deleteMany({ post: postId });

    //delete the post
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post deleted successfully" });
  })
);
export { router as postRoutes };
