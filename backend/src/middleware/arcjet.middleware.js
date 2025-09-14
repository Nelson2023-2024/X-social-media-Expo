import { aj } from "../config/arcjet.config.js";

//arcjet middleware for rate limiting, bot protection and security
export const arcjetMiddleware = async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested: 1, //each request consumes 1 token
    });

    //handle denied requests
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later",
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({
          error: "Bot access denied",
          message: "Automated requests are not allowed",
        });
      } else {
        return res.status(403).json({
          error: "Forbidden",
          message: "Access denied by security policy",
        });
      }
    }

    //check for spoofed bot - bots that act like a human
    if (
      decision.results.some(
        (result) => result.reason.isBot() && result.reason.isSpoofed()
      )
    ) {
      return res.status(403).json({
        error: "Spoofed bot detected",
        message: "Malicious bot activity detected",
      });
    }

    next();
  } catch (error) {
    console.error("Arcjet middleware error:", error);

    //if arcjet fails call the next function until arcjet starts working
    next();
  }
};
