import Discord from "discord.js";
import config from "../config";
import { Readable } from "stream";
import ytdl from "ytdl-core";

type command = { command: string; params: string };
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

client.on("message", (message) => {
  const { command, params } = getCommand(message);

  if (!command) {
    return;
  }

  if (command === "invoke") {
    connectToVoice(message);
  }

  if (command === "leave" || command === "clear") {
    disconnectFromVoice(message);
  }

  if (command === "m" || command === "meme") {
    playSavedAudio(message, params);
  }

  if (command === "p" || command === "play") {
    playYoutubeAudio(message, params);
  }

  if (command === "pause") {
    pauseAudio(message);
  }

  if (command === "resume") {
    resumeAudio(message);
  }
});

export default client;
