import express from "express";
import config from "../config";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

export default app;
