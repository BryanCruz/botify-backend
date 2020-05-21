import app from "./api/app";
import config from "./config";
import discordClient from "./discord/client";

const appPort = config.apiPort;

app.listen(appPort, () => {
  console.log(`Server is running in http://localhost:${appPort}`);
});

discordClient.on("ready", () => {
  console.log(`Logged in as ${discordClient.user.tag}`);
});
