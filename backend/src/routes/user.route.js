import { Router } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/User.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAuth } from "@clerk/express";

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
