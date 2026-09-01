export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const PLAYLIST_ID = "PLfdfb0LKtKKs8IcyIvtsf_FfmJU-1pbI1";

  if (!API_KEY) {
    return res.status(500).json({
      error: "YOUTUBE_API_KEY environment variable is missing."
    });
  }

  try {
    const songs = [];
    let pageToken = "";

    do {
      const url = new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems"
      );

      url.searchParams.set("part", "snippet,contentDetails");
      url.searchParams.set("playlistId", PLAYLIST_ID);
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("key", API_KEY);

      if (pageToken) {
        url.searchParams.set("pageToken", pageToken);
      }

      const response = await fetch(url);

      if (!response.ok) {
        const detail = await response.text();

        return res.status(response.status).json({
          error: "YouTube API request failed.",
          detail: detail
        });
      }

      const data = await response.json();

      for (const item of data.items || []) {
        const videoId = item?.contentDetails?.videoId;

        if (!videoId) continue;

        songs.push({
          videoId: videoId,
          title: item.snippet?.title || "Unknown Song",
          artist: "YouTube",
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            ""
        });
      }

      pageToken = data.nextPageToken || "";

    } while (pageToken);

    res.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json({
      playlistId: PLAYLIST_ID,
      count: songs.length,
      songs: songs
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Unable to load YouTube playlist."
    });
  }
}
