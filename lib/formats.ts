export type Category = "video" | "audio" | "image";

export type Format = {
  key: string;
  label: string;
  ext: string;
  note?: string;
};

export const FORMATS: Record<Category, Format[]> = {
  video: [
    { key: "mp4", label: "MP4", ext: "mp4", note: "Most compatible" },
    { key: "mov", label: "MOV", ext: "mov", note: "QuickTime container" },
    { key: "webm", label: "WEBM", ext: "webm", note: "Smaller, modern" },
    { key: "mkv", label: "MKV", ext: "mkv", note: "Flexible container" },
  ],
  audio: [
    { key: "mp3", label: "MP3", ext: "mp3", note: "Universal" },
    { key: "wav", label: "WAV", ext: "wav", note: "Lossless" },
    { key: "m4a", label: "M4A", ext: "m4a", note: "AAC container" },
    { key: "flac", label: "FLAC", ext: "flac", note: "Lossless" },
    { key: "ogg", label: "OGG", ext: "ogg", note: "Open format" },
  ],
  image: [
    { key: "png", label: "PNG", ext: "png", note: "Lossless" },
    { key: "jpg", label: "JPG", ext: "jpg", note: "Smaller" },
    { key: "webp", label: "WEBP", ext: "webp", note: "Modern" },
    { key: "avif", label: "AVIF", ext: "avif", note: "Very small" },
  ],
};

export function guessCategory(mime?: string): Category | null {
  if (!mime) return null;
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  return null;
}

export function contentTypeFor(ext: string): string {
  const e = ext.toLowerCase();

  if (e === "mp3") return "audio/mpeg";
  if (e === "wav") return "audio/wav";
  if (e === "m4a") return "audio/mp4";
  if (e === "flac") return "audio/flac";
  if (e === "ogg") return "audio/ogg";

  if (e === "mp4") return "video/mp4";
  if (e === "mov") return "video/quicktime";
  if (e === "webm") return "video/webm";
  if (e === "mkv") return "video/x-matroska";

  if (e === "png") return "image/png";
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "webp") return "image/webp";
  if (e === "avif") return "image/avif";

  return "application/octet-stream";
}
