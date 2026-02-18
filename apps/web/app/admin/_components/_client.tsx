"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Music,
  Users,
  Radio,
  Check,
  X,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  Play,
  ListMusic,
  SkipForward,
  Pause,
  Sparkles,
} from "lucide-react";
import { FaSpotify } from "react-icons/fa";

type SpotifyConnectionStatus = "loading" | "connected" | "disconnected";

export default function AdminClient() {
  const [spotifyStatus, setSpotifyStatus] =
    useState<SpotifyConnectionStatus>("loading");

  useEffect(() => {
    let isCancelled = false;

    const checkSpotifyConnection = async () => {
      try {
        const response = await fetch("/api/spotify/token", {
          method: "GET",
          cache: "no-store",
        });

        if (!isCancelled) {
          setSpotifyStatus(response.ok ? "connected" : "disconnected");
        }
      } catch {
        if (!isCancelled) {
          setSpotifyStatus("disconnected");
        }
      }
    };

    checkSpotifyConnection();

    return () => {
      isCancelled = true;
    };
  }, []);

  const pendingRequests = [
    {
      id: 1,
      title: "Blinding Lights",
      artist: "The Weeknd",
      user: "Alex",
      time: "2m ago",
    },
    {
      id: 2,
      title: "Levitating",
      artist: "Dua Lipa",
      user: "Priya",
      time: "5m ago",
    },
    {
      id: 3,
      title: "Starboy",
      artist: "The Weeknd",
      user: "Sam",
      time: "8m ago",
    },
  ];

  const stats = [
    { label: "Active Users", value: "12", icon: Users },
    { label: "Songs Played", value: "47", icon: Play },
    { label: "Queue Length", value: "8", icon: ListMusic },
  ];

  const quickActions = [
    { label: "Skip Song", icon: SkipForward },
    { label: "Pause Room", icon: Pause },
    { label: "Clear Queue", icon: X },
    { label: "View Room", icon: ExternalLink },
  ];

  const isSpotifyConnected = spotifyStatus === "connected";

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Navigation */}
        <nav className="p-4 sm:p-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              PulseQ
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>

            {spotifyStatus === "connected" ? (
              <Button
                className="border-green-500/40 bg-green-500/15 text-green-600 hover:bg-green-500/25"
                variant="outline"
                disabled
              >
                <FaSpotify className="h-4 w-4" />
                Spotify Connected
              </Button>
            ) : spotifyStatus === "loading" ? (
              <Button variant="outline" disabled>
                <FaSpotify className="h-4 w-4" />
                Checking Spotify...
              </Button>
            ) : (
              <Link href="/api/spotify/connect">
                <Button
                  className="bg-green-500 text-white hover:bg-green-700/90"
                  variant="outline"
                >
                  <FaSpotify className="h-4 w-4" />
                  Connect Spotify
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="mx-auto w-full max-w-6xl px-4 pb-16">
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
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Badge>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Manage Your{" "}
              <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                Music Room
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
              Control playback, moderate requests, and keep the party going
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="text-center"
              >
                <Card className="rounded-xl border-border/60 bg-card/80 backdrop-blur-xl p-4">
                  <CardContent className="px-0">
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-2">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Room Controls Card */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Room Controls
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Manage your music room
                    </p>
                  </div>
                  <div
                    className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      isSpotifyConnected
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-amber-500/10 border-amber-500/20"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSpotifyConnected ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSpotifyConnected ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {isSpotifyConnected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                </div>

                {/* Room Info */}
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Room Code
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xl font-bold tracking-wider">
                        PQ-7H2K
                      </p>
                      <Button variant="ghost" size="icon-sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Spotify Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isSpotifyConnected ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <p className="font-semibold">
                        {isSpotifyConnected ? "Linked" : "Not linked"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isSpotifyConnected
                        ? "Ready to start playing"
                        : "Connect to start playing"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className="flex-1 h-auto rounded-xl bg-linear-to-r from-primary to-primary/80 px-5 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                      type="button"
                    >
                      <Zap className="w-4 h-4" />
                      Create Room
                    </Button>
                  </motion.div>

                  <Button
                    variant="outline"
                    className="flex-1 py-3.5 h-auto"
                    size="lg"
                  >
                    <X className="w-4 h-4" />
                    End Room
                  </Button>
                </div>

                <Separator className="mt-6 border-border/50" />
                <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Spotify Premium required</span>
                  </div>
                  <Link
                    href="/join"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Join a room instead
                  </Link>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {quickActions.map((action, i) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="group h-auto w-full rounded-xl border-border/50 bg-card/50 backdrop-blur-sm p-4 hover:border-primary/30 hover:bg-card/80 transition-all flex-col"
                      type="button"
                    >
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-2 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{action.label}</p>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Sidebar - Moderation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Moderation Card */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xl"
              >
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold">Moderation</h2>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs px-2.5 py-1 h-auto bg-primary/10 border-primary/20 text-primary font-medium"
                  >
                    {pendingRequests.length} pending
                  </Badge>
                </div>

                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {pendingRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="rounded-xl border border-border/50 bg-background/50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {request.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {request.artist}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {request.user} • {request.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          className="bg-green-500 hover:bg-green-700/90 text-white flex-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-red-500 hover:bg-red-700/90 text-white flex-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Room Activity */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold">Room Activity</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Session Time
                    </span>
                    <span className="font-semibold">1h 23m</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Total Votes
                    </span>
                    <span className="font-semibold">156</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">
                      Requests
                    </span>
                    <span className="font-semibold">24</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
