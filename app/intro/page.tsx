"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const KEY = "wc_ack_ffmpeg_notice_v1";

type Status = { ok: boolean; text: string } | null;

export default function IntroPage() {
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [ffmpegStatus, setFfmpegStatus] = useState<Status>(null);

  useEffect(() => {
    // If already accepted, skip intro
    const ok = localStorage.getItem(KEY) === "1";
    if (ok) router.replace("/");
  }, [router]);

  async function checkFfmpeg() {
    setChecking(true);
    setFfmpegStatus(null);

    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();

      if (data?.ok) setFfmpegStatus({ ok: true, text: data.ffmpeg || "FFmpeg detected." });
      else setFfmpegStatus({ ok: false, text: data?.error || "FFmpeg not detected." });
    } catch {
      setFfmpegStatus({ ok: false, text: "Health check failed. Make sure the dev server is running." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen relative">
      {/* Background (subtle) */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(0,173,181,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_80%,rgba(238,238,238,0.10),transparent_60%)]" />

      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,173,181,0.40),transparent_60%)] blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,173,181,0.22),transparent_62%)] blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute top-16 left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(238,238,238,0.14),transparent_65%)] blur-3xl" />

        {/* Modal card */}
        <div className="relative w-full max-w-xl">
          {/* thin glow border */}
          <div className="absolute -inset-[1px] rounded-[22px] bg-[linear-gradient(135deg,rgba(0,173,181,0.55),rgba(238,238,238,0.10),rgba(0,173,181,0.20))] blur-[0.5px]" />
          <div className="relative glass rounded-[22px] border border-white/10 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Before you start</h1>
                <p className="muted mt-2 text-sm leading-relaxed">
                  This converter runs locally and depends on system tools.
                </p>
              </div>
              <div className="h-10 w-10 rounded-2xl glass grid place-items-center">
                <span className="text-[var(--accent)] font-semibold">W</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="text-sm font-semibold">Notes</div>
              <p className="muted mt-2 text-sm leading-relaxed">
                Local usage requires <span className="text-[var(--accent)] font-semibold">FFmpeg</span> installed on your
                machine. If deployed, conversions should run on a{" "}
                <span className="text-[var(--accent)] font-semibold">worker/VPS</span> (serverless timeouts are common).
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs font-semibold">Windows</div>
                  <div className="mt-1 text-xs muted">
                    <span className="text-[var(--accent)] font-semibold">
                      winget install -e --id Gyan.FFmpeg
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] muted">Restart terminal → run ffmpeg -version</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs font-semibold">macOS</div>
                  <div className="mt-1 text-xs muted">
                    <span className="text-[var(--accent)] font-semibold">brew install ffmpeg</span>
                  </div>
                  <div className="mt-1 text-[11px] muted">Then run ffmpeg -version</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/10 p-3 sm:col-span-2">
                  <div className="text-xs font-semibold">Linux (Debian/Ubuntu)</div>
                  <div className="mt-1 text-xs muted">
                    <span className="text-[var(--accent)] font-semibold">
                      sudo apt update && sudo apt install -y ffmpeg
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className="btn" type="button" onClick={checkFfmpeg} disabled={checking}>
                  {checking ? "Checking…" : "Verify FFmpeg"}
                </button>

                {ffmpegStatus ? (
                  <div className={`text-sm ${ffmpegStatus.ok ? "text-[var(--accent)]" : "text-red-300"}`}>
                    {ffmpegStatus.text}
                  </div>
                ) : (
                  <div className="text-sm muted">Checks /api/health on your local server</div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="chip w-full sm:w-auto justify-start">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  style={{ accentColor: "var(--accent)" }}
                />
                <span>I understand and want to continue</span>
              </label>

              <button
                className="btn w-full sm:w-auto"
                disabled={!checked}
                onClick={() => {
                  localStorage.setItem(KEY, "1");
                  router.push("/");
                }}
                type="button"
              >
                Continue
              </button>
            </div>

            <p className="muted mt-4 text-[11px]">
              You’ll see this once per browser unless you clear site data.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
