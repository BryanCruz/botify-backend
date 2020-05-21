import express from "express";

const appPort = 3000;
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(appPort, () => {
  console.log(`Server is running in http://localhost:${appPort}`);
});
