import Discord from "discord.js";
import config from "../config";
import { Readable } from "stream";
import ytdl from "ytdl-core";

type command = { command: string; params: string };
type commandConfig = {
  name: string;
  aliases: string[];
  description: string;
  function: any;
};
type voiceConectionMap = { [guildId: string]: Discord.VoiceConnection };
type acceptedAudioType = Discord.VoiceBroadcast | Readable | string;
type audioQueue = Array<{
  audio: acceptedAudioType;
  streamDispatcher: Discord.StreamDispatcher | null;
  pausedByUser: boolean;
}>;
type audioQueueMap = {
  [guildId: string]: audioQueue;
};

const client = new Discord.Client();
const voiceConnections: voiceConectionMap = {};
const audioQueues: audioQueueMap = {};

client.login(config.discordToken);

const findCommand = (commandToFind: string) =>
  commands.find(
    (commandConfig) =>
      commandConfig.name === commandToFind ||
      commandConfig.aliases.find((alias) => alias === commandToFind)
  );

const getCommandAndParams = (message: Discord.Message): command | null => {
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

const showHelp = (message: Discord.Message, params: string) => {
  const textChannel = message.channel;

  if (params === "") {
    const helpMessages = commands
      .map((command) => {
        const aliasesHelp =
          command.aliases.length > 0 ? `(${command.aliases.join(",")})` : "";

        return `- ${command.name}${aliasesHelp}: ${command.description}`;
      })
      .join("\n");

    textChannel.send(`\`\`\`\n${helpMessages}\n\`\`\``);
    return;
  }

  const commandToGetHelp = findCommand(params);
  if (!commandToGetHelp) {
    textChannel.send("```Comando não encontrado```");
  }
};

const getVoiceChannel = (message: Discord.Message): Discord.VoiceChannel => {
  const authorGuildMember = message.member;
  const voiceChannel = authorGuildMember.voice.channel;

  return voiceChannel;
};

const connectToVoice = (message: Discord.Message) => {
  const voiceChannel = getVoiceChannel(message);

  return voiceChannel
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

  const guildId = message.guild.id;
  delete voiceConnections[guildId];
  delete audioQueues[guildId];

  voiceChannel.leave();
};

const playAudio = async (
  message: Discord.Message,
  audio: acceptedAudioType
) => {
  const guildId = message.guild.id;
  if (!voiceConnections[guildId]) {
    await connectToVoice(message);
  }

  const connection = voiceConnections[guildId];
  const streamDispatcher = connection.play(audio, {
    volume: 0.4,
    bitrate: "auto",
  });

  return streamDispatcher;
};

const dequeueAudio = async (message: Discord.Message) => {
  const guildId = message.guild.id;
  const audioQueue = audioQueues[guildId];
  const audioDetails = audioQueue[0];

  if (!audioDetails) {
    delete audioQueues[guildId];
    return;
  }

  const streamDispatcher = await playAudio(message, audioDetails.audio);
  audioDetails.streamDispatcher = streamDispatcher;

  streamDispatcher.on("speaking", (speaking) => {
    if (!speaking && !audioDetails.pausedByUser) {
      audioQueue.shift();
      dequeueAudio(message);
    }
  });
};

const enqueueAudio = async (
  message: Discord.Message,
  audio: acceptedAudioType
) => {
  const guildId = message.guild.id;

  const existentQueue = audioQueues[guildId];

  if (!existentQueue) {
    audioQueues[guildId] = [];
  }

  audioQueues[guildId].push({
    audio,
    streamDispatcher: null,
    pausedByUser: false,
  });

  if (!existentQueue) {
    dequeueAudio(message);
  }
};

const pauseAudio = (message: Discord.Message) => {
  const currentAudioDetails = audioQueues[message.guild.id][0];

  if (!currentAudioDetails) {
    return;
  }

  currentAudioDetails.pausedByUser = true;
  currentAudioDetails.streamDispatcher.pause();
};

const resumeAudio = (message: Discord.Message) => {
  const currentAudioDetails = audioQueues[message.guild.id][0];

  if (!currentAudioDetails) {
    return;
  }

  currentAudioDetails.pausedByUser = false;
  currentAudioDetails.streamDispatcher.resume();
};

const skipAudio = (message: Discord.Message) => {
  const audioQueue = audioQueues[message.guild.id];
  if (!audioQueue || !audioQueue[0]) {
    return;
  }

  pauseAudio(message);
  audioQueues[message.guild.id].shift();
  dequeueAudio(message);
};

const playSavedAudio = async (message: Discord.Message, nameToPlay: string) => {
  const foundAudio = config.audio.find((audio) =>
    audio.aliases.find((alias) => alias === nameToPlay)
  );

  if (!foundAudio) {
    return;
  }

  enqueueAudio(message, `./src/audio/${foundAudio.name}.mp3`);
};

const playYoutubeAudio = async (
  message: Discord.Message,
  whatToPlay: string
) => {
  const ytRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
  const ytMatch = whatToPlay.match(ytRegex);
  if (ytMatch) {
    enqueueAudio(
      message,
      ytdl(`https://www.youtube.com/watch?v=${ytMatch[1]}`)
    );
  }
};

const commands: commandConfig[] = [
  {
    name: "help",
    aliases: ["h"],
    description:
      "Show help message. To see help for a specific command, use `$help <command>`",
    function: showHelp,
  },
  {
    name: "invoke",
    aliases: [],
    description: "Invoke bot to user current voice channel",
    function: connectToVoice,
  },
  {
    name: "leave",
    aliases: [],
    description: "Leave bot from his current voice channel",
    function: disconnectFromVoice,
  },
  {
    name: "meme",
    aliases: ["m"],
    description: "Play a meme",
    function: playSavedAudio,
  },
  {
    name: "play",
    aliases: ["p"],
    description: "Play a Youtube audio",
    function: playYoutubeAudio,
  },
  {
    name: "pause",
    aliases: [],
    description: "Pause current audio",
    function: pauseAudio,
  },
  {
    name: "resume",
    aliases: [],
    description: "Resume current audio",
    function: resumeAudio,
  },
  {
    name: "skip",
    aliases: ["s"],
    description: "Skip current audio",
    function: skipAudio,
  },
];

client.on("message", (message) => {
  const { command, params } = getCommandAndParams(message);
  const commandToCall = findCommand(command);

  if (!commandToCall) {
    return;
  }

  commandToCall.function(message, params);
});

export default client;
