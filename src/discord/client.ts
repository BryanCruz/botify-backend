import Discord from "discord.js";
import config from "../config";

type command = { command: string; params: string };

const client = new Discord.Client();

client.login(config.discordToken);

const getCommand = (message: Discord.Message): command | null => {
  const emptyCommand: command = { command: null, params: null };

  if (message.author.bot || message.channel.type !== "text") {
    return emptyCommand;
  }

  const regexTest = message.content.match(/\$ *([a-zA-Z]*)(.*)/);

  if (!regexTest) {
    return emptyCommand;
  }

  return { command: regexTest[1].toLowerCase(), params: regexTest[2].trim() };
};

client.on("message", (message) => {
  const { command, params } = getCommand(message);

  if (!command) {
    return;
  }
});

export default client;
