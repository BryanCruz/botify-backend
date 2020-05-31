import fs from "fs";

type audioConfig = Array<{
  name: string;
  aliases: string[];
  description: string;
}>;

const audio: audioConfig = JSON.parse(
  fs.readFileSync("./src/audio/config.json").toString()
);

export default {
  discordToken: process.env.DISCORD_TOKEN,
  youtubeToken: process.env.YOUTUBE_TOKEN,
  apiPort: 3000,
  audio,
};
