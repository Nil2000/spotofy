"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export default function JoinPage() {
  const [code, setCode] = useState("");

  const normalized = useMemo(
    () => code.trim().replaceAll(" ", "").toUpperCase(),
    [code],
  );

  const href = normalized
    ? `/room/${encodeURIComponent(normalized)}`
    : "/room/PQ-7H2K";

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="absolute inset-0 bg-linear-to-br from-secondary/6 via-background to-primary/6 pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">PulseQ</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold">Join a Room</h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Enter a room code and jump into the live queue.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-xl"
        >
          <label className="text-sm font-semibold" htmlFor="roomCode">
            Room code
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="roomCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PQ-7H2K"
              className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
            />

            <Link href={href} className="sm:w-[160px]">
              <motion.button
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 0 30px rgba(var(--secondary), 0.45)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-lg bg-secondary px-5 py-3 font-bold text-secondary-foreground shadow-lg hover:shadow-secondary/40 transition-all"
                type="button"
              >
                Join
              </motion.button>
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Tip: You can join as a guest — no Spotify required.
            </p>
            <Link
              href="/"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {[
            "Request songs",
            "Upvote favorites",
            "Live updates",
            "Party-friendly",
          ].map((t) => (
            <div
              key={t}
              className="rounded-xl border border-border bg-card/70 p-4 text-sm text-muted-foreground"
            >
              <span className="font-semibold text-foreground">{t}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
