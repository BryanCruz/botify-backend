import audioConfig from "./audio/config.json";

type audioConfig = Array<{ name: string; aliases: string[] }>;
const audio = (audioConfig as audioConfig) || [
  {
    name: "sample",
    aliases: ["sample", "samp", "s"],
  },
];

export default {
  discordToken: process.env.DISCORD_TOKEN,
  apiPort: 3000,
  audio,
};
