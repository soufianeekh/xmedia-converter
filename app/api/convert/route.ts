import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import sharp from "sharp";
import { execa } from "execa";
import { FORMATS, contentTypeFor } from "@/lib/formats";

export const runtime = "nodejs"; // IMPORTANT for local ffmpeg usage

const MAX_BYTES = 250 * 1024 * 1024; // 250MB (adjust)

function isAllowed(category: string, fmt: string) {
  if (category !== "video" && category !== "audio" && category !== "image") return false;
  return FORMATS[category].some((f) => f.key === fmt);
}

function safeBaseName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().slice(0, 60) || "file";
}

async function writeTempFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new Error(`File too large. Max allowed is ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`);
  }

  const buf = Buffer.from(arrayBuffer);
  const tmpDir = os.tmpdir();
  const inputId = crypto.randomUUID();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();

  const inputPath = path.join(tmpDir, `${inputId}.input.${ext}`);
  await fs.writeFile(inputPath, buf);

  return { inputPath, size: buf.length };
}

async function convertImage(inputPath: string, outExt: string, outPath: string) {
  // sharp uses "jpeg" not "jpg"
  const fmt = outExt === "jpg" ? "jpeg" : outExt;
  await sharp(inputPath).toFormat(fmt as any).toFile(outPath);
}

function ffmpegArgsFor(
  category: "video" | "audio",
  outExt: string,
  inputPath: string,
  outPath: string
) {
  // Minimal “professional” defaults without overcomplicating:
  // You can extend per-format with bitrate/codec/resolution controls.

  if (category === "audio") {
    if (outExt === "mp3") return ["-y", "-i", inputPath, "-vn", "-b:a", "192k", outPath];
    if (outExt === "wav") return ["-y", "-i", inputPath, "-vn", outPath];
    if (outExt === "m4a") return ["-y", "-i", inputPath, "-vn", "-c:a", "aac", "-b:a", "192k", outPath];
    if (outExt === "flac") return ["-y", "-i", inputPath, "-vn", outPath];
    if (outExt === "ogg") return ["-y", "-i", inputPath, "-vn", "-c:a", "libvorbis", "-q:a", "5", outPath];
    return ["-y", "-i", inputPath, "-vn", outPath];
  }

  // video
  // Use yuv420p for broad H.264 compatibility; use +faststart for better progressive playback. 
  // (FFmpeg docs: +faststart moves metadata to the beginning for MOV/MP4.) 
  // See citations in chat message above.
  if (outExt === "mp4")
    return [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outPath,
    ];

  // ✅ MOV support
  if (outExt === "mov")
    return [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      outPath,
    ];

  if (outExt === "webm")
    return ["-y", "-i", inputPath, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus", outPath];

  if (outExt === "mkv") return ["-y", "-i", inputPath, outPath];

  return ["-y", "-i", inputPath, outPath];
}

async function convertAV(category: "video" | "audio", inputPath: string, outExt: string, outPath: string) {
  const args = ffmpegArgsFor(category, outExt, inputPath, outPath);

  try {
    await execa("ffmpeg", args, {
      timeout: 1000 * 60 * 5, // 5 minutes (adjust)
      stderr: "pipe",
      stdout: "pipe",
    });
  } catch (err: any) {
    const detail = err?.stderr ? String(err.stderr).slice(-1200) : "";
    throw new Error(`FFmpeg failed. ${detail ? "Details:\n" + detail : ""}`);
  }
}

export async function POST(req: Request) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const category = String(form.get("category") || "");
    const format = String(form.get("format") || "");

    if (!(file instanceof File)) return new NextResponse("Missing file.", { status: 400 });
    if (!isAllowed(category, format)) return new NextResponse("Unsupported category/format.", { status: 400 });

    const { inputPath: inPath } = await writeTempFile(file);
    inputPath = inPath;

    const outExt = FORMATS[category as "video" | "audio" | "image"].find((f) => f.key === format)!.ext;
    const base = safeBaseName(file.name);
    const outName = `${base}.${outExt}`;

    outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.output.${outExt}`);

    if (category === "image") {
      await convertImage(inputPath, outExt, outputPath);
    } else {
      await convertAV(category as "video" | "audio", inputPath, outExt, outputPath);
    }

    const outBuf = await fs.readFile(outputPath);
    const headers = new Headers();
    headers.set("Content-Type", contentTypeFor(outExt));
    headers.set("Content-Disposition", `attachment; filename="${outName}"`);
    headers.set("X-Output-Name", outName);

    return new NextResponse(outBuf, { status: 200, headers });
  } catch (e: any) {
    return new NextResponse(e?.message || "Conversion error.", { status: 500 });
  } finally {
    // cleanup
    try {
      if (inputPath) await fs.unlink(inputPath);
    } catch {}
    try {
      if (outputPath) await fs.unlink(outputPath);
    } catch {}
  }
}
