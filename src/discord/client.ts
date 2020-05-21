import Discord from "discord.js";
import config from "../config";

type command = { command: string; params: string };
type voiceConectionMap = { [guildId: string]: Discord.VoiceConnection };

const client = new Discord.Client();
const voiceConnections: voiceConectionMap = {};

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

const getVoiceChannel = (message: Discord.Message): Discord.VoiceChannel => {
  const authorGuildMember = message.member;
  const voiceChannel = authorGuildMember.voice.channel;

  return voiceChannel;
};

const connectToVoice = (message: Discord.Message) => {
  const voiceChannel = getVoiceChannel(message);

  voiceChannel
    .join()
    .then((connection) => {
      voiceConnections[voiceChannel.guild.id] = connection;
    })
    .catch((err) => {
      console.error(err);
    });
};

const disconnectFromVoice = (message: Discord.Message) => {
  const voiceChannel = getVoiceChannel(message);

  delete voiceConnections[voiceChannel.id];
  voiceChannel.leave();
};

client.on("message", (message) => {
  const { command, params } = getCommand(message);

  if (!command) {
    return;
  }

  if (command === "invoke") {
    connectToVoice(message);
  }

  if (command === "leave") {
    disconnectFromVoice(message);
  }
});

export default client;
