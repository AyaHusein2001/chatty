import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import "dotenv/config";
import clerkWebhook from "./webhooks/clerk.webhook.js";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

const app = express();
const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const publicDir = path.join(process.cwd(), "public");

// it's important that you don't parse the webhook event data, it should be in the raw format
app.use(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook,
);

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());

// if the public directory exists, serve the static files
// this is for the production build(deployment only)
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  //redirect any route that is not an API route to the index.html file in the public directory to allow the frontend to handle the routing(react router)
  app.get("*", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") job.start();
});
