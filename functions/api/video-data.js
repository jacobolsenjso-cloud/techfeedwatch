// Cloudflare Pages Function: GET /api/video-data?id=<youtube-url-or-id>
// Fetches title, description, thumbnail, publishedAt, and duration for a YouTube video
// via the YouTube Data API v3, using the server-side env.YOUTUBE_API_KEY.

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

function extractVideoId(raw) {
  if (!raw) return null;
  const value = raw.trim();

  // Allow a bare 11-character video ID to be passed directly.
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id || null;
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }
      const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // Not a valid URL, fall through.
  }

  return null;
}

export async function onRequestOptions() {
  return new Response(null, { headers: JSON_HEADERS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get('id');

  if (!rawId) {
    return jsonError('Missing required "id" query parameter (YouTube URL or video ID).', 400);
  }

  const videoId = extractVideoId(rawId);
  if (!videoId) {
    return jsonError('Could not extract a valid YouTube video ID from the provided input.', 400);
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return jsonError('Server misconfiguration: YOUTUBE_API_KEY is not set.', 500);
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;

  let apiResponse;
  try {
    apiResponse = await fetch(apiUrl);
  } catch {
    return jsonError('Failed to reach the YouTube Data API.', 502);
  }

  if (!apiResponse.ok) {
    return jsonError(`YouTube Data API request failed (status ${apiResponse.status}).`, 502);
  }

  let data;
  try {
    data = await apiResponse.json();
  } catch {
    return jsonError('Received an invalid response from the YouTube Data API.', 502);
  }

  const item = data.items && data.items[0];
  if (!item) {
    return jsonError('Video not found.', 404);
  }

  const { snippet, contentDetails } = item;
  const thumbnails = snippet.thumbnails || {};
  const bestThumbnail =
    thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;

  const result = {
    videoId,
    title: snippet.title,
    description: snippet.description,
    thumbnailUrl: bestThumbnail ? bestThumbnail.url : null,
    publishedAt: snippet.publishedAt,
    duration: contentDetails.duration,
  };

  return new Response(JSON.stringify(result), { status: 200, headers: JSON_HEADERS });
}
