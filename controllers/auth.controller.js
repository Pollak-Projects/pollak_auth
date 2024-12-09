import express from "express";
import {
  verifyJwt,
  updateMainData,
  listAllTokens,
  pwdChange,
  login,
  register,
} from "../services/auth.service.js";
import { Kuldes } from "../services/emailsender.js";

const router = express.Router();

router.get("/verify", (req, res) => {
  const access_token = req.cookies.access_token;
  const refresh_token = req.cookies.refresh_token;

  if (!access_token || !refresh_token)
    res.status(401).json({ message: "Token nem található" });
  else {
    verifyJwt(access_token, refresh_token)
      .then((data) => {
        if (data === "OK") {
          res.status(200).json({ message: "OK" });
        } else {
          res.cookie("access_token", data, {
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.status(200).json({ message: "Refreshed" });
        }
      })
      .catch((err) => {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.status(403).json({ message: err });
      });
  }
});

router.post("/register", async (req, res) => {
  const { username, email, password, nev, om, groupsNeve } = req.body;
  try {
    const user = await register(username, email, password, nev, om, groupsNeve);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);

  try {
    const user = await login(username, password);

    res.cookie("access_token", user.access_token, {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
      httpOnly: false,
      domain: "pollak.info",
      path: "/",
    });
    res.cookie("refresh_token", user.refresh_token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: "none",
      secure: true,
      domain: "pollak.info",
      path: "/",
    });

    req.session.user_id = user.user_id;

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/update", async (req, res) => {
  const {
    JWTAlgorithm,
    JWTExpiration,
    JWTSecret,
    RefreshTokenAlgorithm,
    RefreshTokenExpiration,
    RefreshTokenSecret,
  } = req.body;

  const asd = await updateMainData(
    JWTAlgorithm,
    JWTExpiration,
    JWTSecret,
    RefreshTokenAlgorithm,
    RefreshTokenExpiration,
    RefreshTokenSecret
  );

  res.status(200).json({
    message: asd,
  });
});

router.get("/token", async (req, res) => {
  try {
    const data = await listAllTokens();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching token data:", err);
    res.status(500).send("Error loading token settings");
  }
});

router.get("/genToken", async (req, res) => {
  try {
    res.status(200).json(data);
  } catch (err) {
    console.error("Error generating token: ", err);
    res.status(500).send("Error generating token");
  }
});

router.get("/validate", async (req, res) => {
  try {
    res.status(200).json(data);
  } catch (err) {
    console.error("Error validating token: ", err);
    res.status(500).send("Error validating token");
  }
});

router.put("/pwdChange", async (req, res) => {
  try {
    const { pwd1, pwd2, id } = req.body;
    const data = await pwdChange(pwd1, pwd2, id);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error changing password: ", err);
    res.status(500).send("Error changing password");
  }
});

router.post("/email", async (req, res) => {
  const { email } = req.body;
  try {
    const data = await Kuldes(email);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).send("Error sending email");
  }
});

router.post("/logout", (req, res) => {
  console.log("req.cookies", req.cookies);
  res.clearCookie("access_token", {
    domain: "pollak.info",
    path: "/",
  });
  res.clearCookie("refresh_token", {
    domain: "pollak.info",
    path: "/",
  });
  res.clearCookie("sid", {
    domain: "pollak.info",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export { router as authController };
