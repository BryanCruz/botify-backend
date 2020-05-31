import ytdl from "ytdl-core";
import { google } from "googleapis";
import config from "../config";
import { Readable } from "stream";

const youtube = google.youtube({
  version: "v3",
  auth: config.youtubeToken,
});

export const getYoutubeAudio = async (
  query: string
): Promise<{ audio: Readable; url: string } | null> => {
  const ytUrlRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
  const ytUrlMatch = query.match(ytUrlRegex);

  if (ytUrlMatch) {
    return downloadVideo(ytUrlMatch[1]);
  }

  const results = (
    await youtube.search.list({
      part: "snippet",
      type: "video",
      order: "relevance",
      q: query,
    })
  ).data.items;

  if (!results) {
    return null;
  }

  for (const video of results) {
    console.log(video.snippet.title);
  }

  const videoToPlay = results[0];
  if (videoToPlay) {
    return downloadVideo(videoToPlay.id.videoId);
  }

  return null;
};

const downloadVideo = (videoId: string) => {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(url);

  return {
    url,
    audio: ytdl(url, {
      filter: "audioonly",
      highWaterMark: 1 << 27, // 120mb
    }),
  };
};
