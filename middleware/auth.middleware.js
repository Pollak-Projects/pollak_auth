import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import { verifyJwt } from "../services/auth.service.js";
import session from "express-session";

const prisma = new PrismaClient();

export function verifyUserGroups(groups = []) {
  return async (req, res, next) => {
    let access_token = req.cookies.access_token
      ? req.cookies.access_token
      : req.headers.Authorization;
    const refresh_token = req.cookies.refresh_token
      ? req.cookies.refresh_token
      : req.headers.RefreshToken;

    if (!req.session || !req.session.user_id) {
      console.warn("No session found");

      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(401).json({ message: "Access Denied" });
    } else {
      console.info(
        "Session OK, Logged in with user_id: " + req.session.user_id
      );
    }

    if (!access_token)
      return res.status(401).json({ message: "Access Denied" });

    try {
      const data = await verifyJwt(access_token, refresh_token);

      if (data !== "OK" && data) {
        access_token = data;
        res.cookie("access_token", data, {
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "none",
          secure: true,
          httpOnly: false,
          domain: "pollak.info",
          path: "/",
        });
      }
    } catch (error) {
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      return res.status(403).json({ message: err });
    }

    const { sub } = jwtDecode(access_token);

    const user = await prisma.user.findUnique({
      where: {
        id: sub,
      },
      include: {
        Groups: true,
      },
    });

    if (!user) return res.status(401).json({ message: "Access Denied" });

    if (req.session.user_id !== user.id) {
      console.warn("Session and user_id mismatch");
      return res.status(401).json({ message: "Access Denied" });
    }

    if (groups.includes(user.Groups.neve)) {
      switch (req.method) {
        case "GET":
          if (user.Groups.read) return next();
          break;
        case "POST":
          if (user.Groups.write) return next();
          break;
        case "PUT":
          if (user.Groups.update) return next();
          break;
        case "DELETE":
          if (user.Groups.delete) return next();
          break;
        case "OPTIONS":
          return next();
        default:
          break;
      }
    }

    return res.status(403).json({ message: "Access Denied" });
  };
}
