"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type RoomPageProps = {
  params: { code: string };
};

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = params;

  const queue = [
    { title: "Starboy", artist: "The Weeknd", votes: 12 },
    { title: "Levitating", artist: "Dua Lipa", votes: 9 },
    { title: "Blinding Lights", artist: "The Weeknd", votes: 7 },
    { title: "As It Was", artist: "Harry Styles", votes: 4 },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="absolute inset-0 bg-linear-to-br from-accent/7 via-background to-primary/7 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">PulseQ Room</p>
            <h1 className="text-3xl md:text-4xl font-bold">{code}</h1>
            <p className="mt-2 text-muted-foreground">
              Request songs, upvote favorites, and keep the vibe going.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/join"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-primary/50 transition-colors"
            >
              Leave
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-md hover:shadow-secondary/40 transition-all"
            >
              Home
            </Link>
          </div>
        </motion.header>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Now Playing</h2>
                <p className="mt-1 text-muted-foreground">
                  Spotify playback will show here once wired up.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                Live
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Track</p>
                  <p className="mt-1 text-2xl font-bold">Midnight City</p>
                  <p className="mt-1 text-muted-foreground">M83</p>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground shadow-md hover:shadow-primary/40 transition-all"
                    type="button"
                  >
                    Upvote
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-lg border border-border bg-card px-4 py-2 font-bold"
                    type="button"
                  >
                    Request
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold">Request a Song</h3>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  placeholder="Search or paste a Spotify track link"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
                />
                <motion.button
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 30px rgba(var(--accent), 0.35)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground shadow-lg hover:shadow-accent/30 transition-all"
                  type="button"
                >
                  Add
                </motion.button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Requests may require admin approval.
              </p>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold">Up Next</h2>
            <p className="mt-1 text-muted-foreground">
              The top-voted song plays next.
            </p>

            <div className="mt-6 space-y-3">
              {queue.map((item) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className="rounded-xl border border-border bg-background/40 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.artist}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-lg bg-card px-2 py-1 text-xs font-bold">
                        {item.votes} votes
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                        type="button"
                      >
                        Upvote
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-background/40 p-4">
              <p className="text-sm font-semibold">People in room</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You, Alex, Priya, Sam
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  );
}
