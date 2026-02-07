"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Music,
  ThumbsUp,
  Plus,
  Users,
  Radio,
  LogOut,
  Home,
  Search,
  Pause,
  SkipForward,
  Volume2,
  Clock,
  Crown,
} from "lucide-react";

type RoomPageProps = {
  params: { code: string };
};

export default function RoomPage({ params }: RoomPageProps) {
  const { code } = params;

  const queue = [
    { title: "Starboy", artist: "The Weeknd", votes: 12, duration: "3:50" },
    { title: "Levitating", artist: "Dua Lipa", votes: 9, duration: "3:23" },
    {
      title: "Blinding Lights",
      artist: "The Weeknd",
      votes: 7,
      duration: "3:20",
    },
    { title: "As It Was", artist: "Harry Styles", votes: 4, duration: "2:47" },
  ];

  const participants = [
    { name: "You", isAdmin: false, isYou: true },
    { name: "Alex", isAdmin: true, isYou: false },
    { name: "Priya", isAdmin: false, isYou: false },
    { name: "Sam", isAdmin: false, isYou: false },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
                    PulseQ
                  </span>
                </Link>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-sm font-semibold tracking-wider">
                    {code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/join"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card/80 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium hover:bg-muted hover:border-primary/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Leave</span>
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-primary/10 border border-primary/20 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-primary hover:bg-primary/20 transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Now Playing */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
              >
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Now Playing</h2>
                        <p className="text-xs text-muted-foreground">
                          Live from Spotify
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="w-full sm:w-32 md:w-40 aspect-square sm:aspect-auto sm:h-32 md:h-40 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                      <Music className="w-12 h-12 sm:w-16 sm:h-16 text-primary/40" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between text-center sm:text-left">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                          Track
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold">
                          Midnight City
                        </h3>
                        <p className="text-muted-foreground mt-1">M83</p>
                      </div>
                      <div className="mt-4">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-2/3 rounded-full bg-linear-to-r from-primary to-accent" />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>2:34</span>
                          <span>4:03</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-r from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <div className="hidden sm:flex items-center gap-2 ml-4">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <div className="w-20 h-1.5 rounded-full bg-muted">
                        <div className="h-full w-3/4 rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Request Song */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Request a Song</h3>
                    <p className="text-xs text-muted-foreground">
                      Add tracks to the queue
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      placeholder="Search for a song or paste Spotify link"
                      className="w-full rounded-xl border border-border bg-background pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-xl bg-linear-to-r from-accent to-accent/80 px-5 sm:px-6 py-3 sm:py-3.5 font-semibold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="sm:inline">Add</span>
                  </motion.button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Requests may require admin approval before appearing in the
                  queue.
                </p>
              </motion.section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Up Next */}
              <motion.aside
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xl"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Up Next</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {queue.length} songs
                  </span>
                </div>

                <div className="p-3 space-y-2 max-h-[320px] sm:max-h-[400px] overflow-y-auto">
                  {queue.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="group rounded-xl border border-border/50 bg-background/50 p-3 hover:border-primary/30 hover:bg-background/80 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                          <Music className="w-4 h-4 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.artist}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            {item.duration}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 hover:bg-primary/20 px-2 py-1 text-xs font-medium text-primary transition-colors"
                            type="button"
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {item.votes}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.aside>

              {/* People in Room */}
              <motion.aside
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold text-sm">In This Room</h2>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {participants.length} online
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${p.isYou ? "bg-primary" : "bg-green-500"}`}
                      />
                      <span className="text-xs font-medium">
                        {p.name}
                        {p.isYou && " (you)"}
                      </span>
                      {p.isAdmin && (
                        <Crown className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
