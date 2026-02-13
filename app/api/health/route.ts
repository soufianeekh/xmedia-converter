import { NextResponse } from "next/server";
import { execa } from "execa";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { stdout } = await execa("ffmpeg", ["-version"], { timeout: 5000 });
    const firstLine = stdout.split("\n")[0] || "FFmpeg detected.";
    return NextResponse.json({ ok: true, ffmpeg: firstLine });
  } catch {
    return NextResponse.json({
      ok: false,
      error:
        "FFmpeg not found. Install it and make sure it is in PATH, then restart your terminal and run: ffmpeg -version",
    });
  }
}
