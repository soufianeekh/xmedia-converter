"use client";
import Image from "next/image";

import { useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/formats";
import { FORMATS, guessCategory } from "@/lib/formats";
import { AnimatePresence, motion } from "framer-motion";

type Status = { ok: boolean; text: string } | null;

const spring = { type: "spring", stiffness: 520, damping: 38 };
const swap = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(6px)" },
};

function Icon({ name }: { name: Category }) {
  const common = "w-5 h-5";
  if (name === "image")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M4 16l5-5 4 4 3-3 4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (name === "audio")
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none">
        <path d="M9 18V6l11-2v12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10 9.5 15 12l-5 2.5V9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function Page() {
  // Popup (shows every refresh)
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [checking, setChecking] = useState(false);
  const [ffmpegStatus, setFfmpegStatus] = useState<Status>(null);

  async function checkFfmpeg() {
    setChecking(true);
    setFfmpegStatus(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      if (data?.ok) setFfmpegStatus({ ok: true, text: data.ffmpeg || "FFmpeg detected." });
      else setFfmpegStatus({ ok: false, text: data?.error || "FFmpeg not detected." });
    } catch {
      setFfmpegStatus({ ok: false, text: "Check failed." });
    } finally {
      setChecking(false);
    }
  }

  // Converter
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [category, setCategory] = useState<Category>("video");
  const [formatKey, setFormatKey] = useState<string>("mp4");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);

  const formats = useMemo(() => FORMATS[category], [category]);

  function pickFile(f: File | null) {
    setError(null);
    setDownloadUrl(null);
    setDownloadName(null);
    setFile(f);

    if (f) {
      const guessed = guessCategory(f.type) || "video";
      setCategory(guessed);

      if (guessed === "audio") setFormatKey("mp3");
      if (guessed === "video") setFormatKey("mp4");
      if (guessed === "image") setFormatKey("png");
    }
  }

  async function onConvert() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDownloadUrl(null);
    setDownloadName(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      fd.append("format", formatKey);

      const res = await fetch("/api/convert", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Conversion failed.");
      }

      const blob = await res.blob();
      const name =
        res.headers.get("x-output-name") ||
        `converted.${formats.find((f) => f.key === formatKey)?.ext || "bin"}`;

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(name);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* FIXED BACKGROUND (no split on scroll) */}
<div className="pointer-events-none fixed inset-0 -z-10">
  {/* base */}
  <div className="absolute inset-0 bg-[#000000]" />

  {/* orange ambience */}
  <div className="absolute -top-40 left-[-12rem] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(232,80,2,0.35),transparent_60%)] blur-3xl" />
  <div className="absolute top-[10rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(232,80,2,0.22),transparent_62%)] blur-3xl" />

  {/* subtle light grain / lift */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(249,249,249,0.06),transparent_45%)]" />
</div>

      {/* POPUP */}
      <AnimatePresence initial={false}>
        {noticeOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Glow blobs (ORANGE) */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,80,2,0.40),transparent_60%)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,80,2,0.22),transparent_62%)] blur-3xl" />

            <motion.div className="relative w-full max-w-md" {...swap} transition={spring}>
              <div className="absolute -inset-[1px] rounded-[22px] bg-[linear-gradient(135deg,rgba(232,80,2,0.55),rgba(249,249,249,0.10),rgba(232,80,2,0.20))]" />
              <div className="relative glass rounded-[22px] border border-white/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Quick note</h2>
                    <p className="muted mt-1 text-sm leading-relaxed">
                      FFmpeg is required for{" "}
                      <span className="text-[var(--accent)] font-semibold">audio/video</span>. Images work without it.
                    </p>
                  </div>

                  <div className="h-9 w-9 rounded-2xl glass grid place-items-center overflow-hidden">
                    <img src="/xmedia.svg" alt="XMedia" className="h-5 w-5 brightness-0 invert opacity-90" />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold">Install (1 line)</div>
                  <div className="mt-2 space-y-1 text-xs muted">
                    <div>
                      <span className="text-[var(--accent)] font-semibold">Windows:</span> winget install -e --id
                      Gyan.FFmpeg
                    </div>
                    <div>
                      <span className="text-[var(--accent)] font-semibold">macOS:</span> brew install ffmpeg
                    </div>
                    <div>
                      <span className="text-[var(--accent)] font-semibold">Linux:</span> sudo apt install -y ffmpeg
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button className="chip" type="button" onClick={checkFfmpeg} disabled={checking}>
                      {checking ? "Checking…" : "Verify"}
                    </button>

                    <AnimatePresence mode="wait" initial={false}>
                      {ffmpegStatus ? (
                        <motion.div
                          key={ffmpegStatus.ok ? "ok" : "bad"}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className={`text-xs ${ffmpegStatus.ok ? "text-[var(--accent)]" : "text-red-300"}`}
                        >
                          {ffmpegStatus.text}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="hint"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="text-xs muted"
                        >
                          Checks /api/health
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="btn w-full" type="button" onClick={() => setNoticeOpen(false)}>
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* MAIN APP */}
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-7">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl glass grid place-items-center overflow-hidden">
              <img src="/xmedia.svg" alt="XMedia" className="h-6 w-6 brightness-0 invert opacity-90" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">XMedia Converter</h1>
              <p className="muted text-sm">Convert image, audio, and video files locally.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr]">
          <motion.div layout className="card glass">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Upload</h2>
                <p className="muted text-sm">Choose a file, pick a target format, then convert.</p>
              </div>

              <button className="chip" onClick={() => inputRef.current?.click()} type="button">
                Browse
              </button>

              <input ref={inputRef} type="file" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            </div>

            <div
              className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0] || null);
              }}
            >
              <p className="text-sm muted">
                Drag & drop here, or <span className="text-[var(--accent)]">browse</span>.
              </p>

              <AnimatePresence mode="wait" initial={false}>
                {file ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 rounded-xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className="muted text-xs">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "unknown"}
                        </div>
                      </div>
                      <button type="button" className="chip" onClick={() => pickFile(null)}>
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="mt-3 text-sm muted"
                  >
                    Tip: very large videos take time; production needs a job queue.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category tabs (animated pill) */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(["video", "audio", "image"] as Category[]).map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className="chip relative overflow-hidden transition-colors duration-200 ease-out"
                    onClick={() => {
                      setCategory(c);
                      if (c === "audio") setFormatKey("mp3");
                      if (c === "video") setFormatKey("mp4");
                      if (c === "image") setFormatKey("png");
                    }}
                  >
                    {active ? (
                      <motion.span
                        layoutId="activeCategoryPill"
                        className="absolute inset-0 rounded-full bg-[rgba(232,80,2,0.18)]"
                        transition={spring}
                      />
                    ) : null}

                    <span className="relative z-10 flex items-center gap-2">
                      <span className="text-[var(--accent)]">
                        <Icon name={c} />
                      </span>
                      <span className="capitalize">{c}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Formats grid (animated swap per category) */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={category}
                className="mt-4 grid gap-3 sm:grid-cols-2"
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.18 }}
              >
                {formats.map((f) => {
                  const selected = f.key === formatKey;
                  return (
                    <motion.button
                      key={f.key}
                      type="button"
                      layout
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      transition={spring}
                      onClick={() => setFormatKey(f.key)}
                      className={`rounded-2xl border p-4 text-left transition-colors duration-200 ease-out ${
                        selected ? "border-[var(--accent)] bg-[rgba(232,80,2,0.10)]" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{f.label}</div>
                        {selected ? (
                          <span className="text-xs text-[var(--accent)] font-semibold">Selected</span>
                        ) : (
                          <span className="text-xs muted">.{f.ext}</span>
                        )}
                      </div>
                      {f.note ? <div className="mt-1 text-xs muted">{f.note}</div> : null}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Convert */}
            <motion.div layout className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn" disabled={!file || busy} onClick={onConvert} type="button">
                {busy ? "Converting…" : "Convert"}
              </button>
              <div className="text-sm muted">
                Output:{" "}
                <span className="text-[var(--accent)] font-semibold transition-colors duration-200 ease-out">
                  {formatKey.toUpperCase()}
                </span>
              </div>
            </motion.div>

            <AnimatePresence initial={false}>
              {error ? (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm"
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {downloadUrl && downloadName ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4 rounded-xl border border-[rgba(232,80,2,0.35)] bg-[rgba(232,80,2,0.10)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Done</div>
                      <div className="muted text-xs">{downloadName}</div>
                    </div>
                    <a className="btn" href={downloadUrl} download={downloadName}>
                      Download
                    </a>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </section>

  {/* CONTACT + FOOTER */}
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="mt-8 space-y-6"
  >
    <div className="card glass w-full overflow-hidden isolate">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Have a note?</div>
          <div className="muted text-sm">Send us an email.</div>
        </div>

        <a
          href="mailto:soufianeholdings@gmail.com?subject=XMedia%20Converter%20Note&body=Hi%20Soufiane%2C%0A%0A"
          className="btn inline-flex items-center justify-center"
        >
          Email us
        </a>
      </div>
    </div>

    <footer className="text-center text-xs muted">
      Made with love from{" "}
      <a
        href="https://github.com/soufianeekh/"
        target="_blank"
        rel="noreferrer"
        className="text-[var(--accent)] hover:opacity-90 transition"
      >
        Soufiane KH
      </a>
    </footer>
  </motion.div>
</div>
</main>
);
}
