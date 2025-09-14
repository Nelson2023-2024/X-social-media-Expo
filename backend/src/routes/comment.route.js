import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAuth } from "@clerk/express";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.model.js";
import Comment from "../models/Comment.model.js";
import Post from "../models/Post.model.js";
import User from "../models/User.model.js";

const router = Router();

//public routes

//getting all the comments on a post by passing a post ID
router.get(
  "/post/:postId",
  asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const comments = await Comment.find({ post: postId })
      .sort({
        createdAt: -1,
      })
      .populate("user", "username firstName lastName profilePicture");

    res.status(200).json({ comments });
  })
);

router.use(protectRoute);
//protected routes

//create comment
router.post(
  "/post/:postId",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "")
      return res.status(400).json({ error: "Comment content is required" });

    const user = await User.findOne({ clerkId: userId });
    const post = await Post.findById(postId);

    if (!user || !post)
      return res.status(404).json({ error: "User or post not found" });

    const comment = await Comment.create({
      user: user._id,
      post: postId,
      content,
    });

    // link the comment to the post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });

    // create notification if not commenting on own post
    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user._id,
        to: post.user,
        type: "comment",
        post: postId,
        comment: comment._id,
      });
    }

    res.status(201).json({ comment });
  })
);

//delete own comment
router.delete(
  "/:commentId",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { commentId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    const comment = await Comment.findById(commentId);

    if (!user || !comment)
      return res.status(404).json({ error: "User or comment not found" });

    if (comment.user.toString() !== user._id.toString())
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });

    // remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    // delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  })
);
export { router as commentRoutes };
