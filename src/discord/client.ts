import Discord from "discord.js";
import config from "../config";

const client = new Discord.Client();

client.login(config.discordToken);

const getCommand = (message: Discord.Message): string | null => {
  if (
    message.author.tag === client.user.tag ||
    message.channel.type !== "text"
  ) {
    return null;
  }

  const regexTest = message.content.match(/\$(.*)/);

  if (!regexTest) {
    return null;
  }

  const command = regexTest[1].trim();
  return command;
};

client.on("message", (message) => {
  const command = getCommand(message);
  console.log(command);

  if (!command) {
    return;
  }
});

export default client;
