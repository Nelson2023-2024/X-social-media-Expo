import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAuth } from "@clerk/express";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.model.js";
import Comment from "../models/Comment.model.js";
import Post from "../models/Post.model.js";
import User from "../models/User.model.js";

const router = Router();

router.use(protectRoute);

//get notifications for authenitcated user
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });

    const notifications = await Notification.find({ to: user._id })
      .sort({ createdAt: -1 })
      .populate("from", "username firstName lastName profilePicture")
      .populate("post", "content image")
      .populate("comment", "content");

    res.status(200).json({ notifications });
  })
);

//delete notifications
router.delete(
  "/:notificationId",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { notificationId } = req.params;

    const user = await User.findOne({ clerkId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      to: user._id,
    });

    if (!notification)
      return res.status(404).json({ error: "Notification not found" });

    res.status(200).json({ message: "Notification deleted successfully" });
  })
);
export { router as notificationRoutes };
