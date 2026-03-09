"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Separator } from "@repo/ui/components/ui/separator";
import { toast } from "@repo/ui/components/ui/sonner";
import {
  ArrowRight,
  Users,
  ThumbsUp,
  Radio,
  PartyPopper,
  Sparkles,
  QrCode,
  Music,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/navbar";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = code.trim().replaceAll(" ", "");

  const handleJoin = async () => {
    if (!normalized) return;
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}`);
      if (res.status === 404) {
        const message = "Room not found. Check the code and try again.";
        setError(message);
        toast.error(message, { id: "join-room-not-found" });
        return;
      }
      if (!res.ok) {
        const message = "Something went wrong. Please try again.";
        setError(message);
        toast.error(message, { id: "join-room-error" });
        return;
      }
      router.push(`/room/${encodeURIComponent(normalized)}`);
    } catch {
      const message = "Something went wrong. Please try again.";
      setError(message);
      toast.error(message, { id: "join-room-request-error" });
    } finally {
      setJoining(false);
    }
  };

  const features = [
    {
      icon: Music,
      label: "Request songs",
      desc: "Add your favorites to the queue",
    },
    {
      icon: ThumbsUp,
      label: "Upvote tracks",
      desc: "Vote for what plays next",
    },
    {
      icon: Radio,
      label: "Live updates",
      desc: "Real-time sync with the room",
    },
    {
      icon: PartyPopper,
      label: "Party-friendly",
      desc: "Perfect for groups",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        <Navbar />

        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 sm:px-6 lg:px-8 pt-20">
          <div className="flex-1 flex flex-col justify-center">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8 sm:mb-10"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-2 px-4 py-2 h-auto rounded-full bg-primary/10 border-primary/20 text-primary text-sm font-medium mb-6"
                >
                  <Users className="w-4 h-4" />
                  Join as Guest
                </Badge>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Join a{" "}
                <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  Music Room
                </span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
                Enter a room code to start voting and requesting songs
              </p>
            </motion.div>

            {/* Join Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-lg mx-auto w-full"
            >
              <Card className="rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/5">
                <CardContent className="px-0">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <label
                        className="text-sm font-semibold text-foreground"
                        htmlFor="roomCode"
                      >
                        Room Code
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Get this from the room admin
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="roomCode"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      placeholder="Paste room code here"
                      className="h-auto flex-1 rounded-xl border-border bg-background px-4 py-3.5 text-base font-mono tracking-wider outline-none focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:tracking-normal"
                      disabled={joining}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="sm:w-auto"
                    >
                      <Button
                        onClick={handleJoin}
                        disabled={!normalized || joining}
                        className="group w-full sm:w-auto h-auto rounded-xl bg-linear-to-r from-primary to-primary/80 px-6 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                        type="button"
                      >
                        {joining ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Join Room
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {error && (
                    <p className="mt-3 text-sm text-red-500">{error}</p>
                  )}

                  <div className="mt-6 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>No Spotify account required</span>
                    </div>
                    <Link
                      href="/admin"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Create a room instead
                    </Link>
                  </div>
                </CardContent>
                <Separator className="mt-6 border-border/50" />
              </Card>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto w-full"
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="group"
                >
                  <Card className="rounded-xl border-border/50 bg-card/50 backdrop-blur-sm p-4 text-center hover:border-primary/30 hover:bg-card/80 transition-all">
                    <CardContent className="px-0">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                        <f.icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm text-foreground">
                        {f.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        {f.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
