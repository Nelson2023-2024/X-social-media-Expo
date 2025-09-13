import { Router } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { clerkClient, getAuth } from "@clerk/express";

const router = Router();

//get profile
router.get(
  "/profile/:username",
  asyncHandler(async (req, res) => {
    const { username } = req.params;

    console.log("Authuser details:" + getAuth(req));
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
  })
);

router.use(protectRoute);

router.post(
  "/sync",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    //check if user already exists in mongoDB
    const userExist = await User.findOne({ clerkId: userId });

    if (userExist)
      return res
        .status(200)
        .json({ user: userExist, message: "User already exists" });

    // create new user from Clerk data
    const clerkUser = await clerkClient.users.getUser(userId);

    const userData = {
      clerkId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstname: clerkUser.firstName || "",
      lastname: clerkUser.lastName || "",
      username: clerkUser.emailAddresses[0].split("@")[0],
      profilePicture: clerkUser.imageUrl || "",
    };

    // save the user to the DB
    const user = await User.create(userData);

    res.status(201).json({ user, message: "user created successfully" });
  })
);

//get the current authenicated user
router.post(
  "/me",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });

    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ user });
  })
);
//update profile => one needs to be authenitcated
router.put(
  "/profile",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req); // this gets you the userid
    const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, {
      new: true,
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ user });
  })
);

//follow a user
router.post(
  "/follow/:targetUserId",
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);
    const { targetUserId } = req.params;

    if (userId === targetUserId)
      return res.status(400).json({ error: "You cannot follow yourself" });

    const currentUser = await User.findOne({ clerkId: userId });
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser)
      return res.status(404).json({ error: "User not found" });

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      //unfollow if U R already following the user
      await User.findByIdAndUpdate(currentUser._id, {
        $pull: { following: targetUserId },
      });

      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUser._id },
      });
    } else {
      // follow
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { following: targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $push: { followers: currentUser._id },
      });

      // create notification on follow
      await Notification.create({
        from: currentUser._id,
        to: targetUserId,
        type: "follow",
      });
    }

    res.status(200).json({
      message: isFollowing
        ? "User unfollowed successfully"
        : "User followed successfully",
    });
  })
);

export { router as userRoutes };
