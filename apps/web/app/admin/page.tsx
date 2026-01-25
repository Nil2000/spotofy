"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">PulseQ</p>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Create a room, connect Spotify, and moderate the queue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/50 transition-colors"
            >
              Back to Home
            </Link>

            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 30px rgba(var(--primary), 0.45)",
              }}
              whileTap={{ scale: 0.98 }}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all"
              type="button"
            >
              Link Spotify Account
            </motion.button>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Room Controls</h2>
            <p className="mt-2 text-muted-foreground">
              UI only for now — wire these up later.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">Room Code</p>
                <p className="mt-1 font-mono text-lg">PQ-7H2K</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-sm text-muted-foreground">Spotify Status</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  Not linked
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg bg-secondary px-5 py-3 font-semibold text-secondary-foreground shadow-md hover:shadow-secondary/40 transition-all"
                type="button"
              >
                Create Room
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg border border-border bg-card px-5 py-3 font-semibold hover:border-accent/60 transition-colors"
                type="button"
              >
                End Room
              </motion.button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Moderation</h2>
            <p className="mt-2 text-muted-foreground">
              Approve or reject requested songs.
            </p>

            <div className="mt-6 space-y-3">
              {["Blinding Lights", "Levitating", "Starboy"].map((title) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-background/40 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested by Alex
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                        type="button"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold"
                        type="button"
                      >
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href="/room/PQ-7H2K"
                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background/40 px-4 py-3 text-sm font-semibold hover:border-primary/50 transition-colors"
              >
                Preview Room UI
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
