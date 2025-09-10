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

export { router as userRoutes };
