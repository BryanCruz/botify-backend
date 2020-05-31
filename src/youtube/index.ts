import ytdl from "ytdl-core";

export const getYoutubeAudio = (query: string) => {
  const ytRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
  const ytMatch = query.match(ytRegex);

  return ytdl(`https://www.youtube.com/watch?v=${ytMatch[1]}`, {
    filter: "audioonly",
    highWaterMark: 1 << 27, // 120mb
  });
};
