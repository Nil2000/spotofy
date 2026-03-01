"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Music,
  ThumbsUp,
  Plus,
  Users,
  Radio,
  Clock,
  Crown,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  LogOut,
  Home,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { JWTPayload } from "@/types/websocket";
import type { SearchResult } from "@/app/api/spotify/search/route";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/ui/combobox";
import Image from "next/image";
import SpotifyWebPlayer from "./spotify-player";

type ClientPageProps = {
  code: string;
  user: JWTPayload;
  spotifyToken: string | null;
};

export default function ClientPage({
  code,
  user,
  spotifyToken,
}: ClientPageProps) {
  const {
    connectionState,
    isConnected,
    error,
    roomConfig,
    queue,
    pendingRequests,
    joinRoom,
    requestSong,
    upvoteSong,
    approveSong,
    rejectSong,
    users,
  } = useWebSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin] = useState(user.isAdmin);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      joinRoom(code, user);
    }
  }, [isConnected, code, user, joinRoom, isAdmin]);

  useDebounce(
    async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    400,
    [searchQuery],
  );

  const handleSelectResult = (value: string | null) => {
    const result = searchResults.find((r) => r.id === value);
    if (!result) return;
    requestSong({
      name: result.name,
      artist: result.artist,
      url: result.url,
      imgUrl: result.imgUrl,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRequestSong = () => {
    if (!searchQuery.trim()) return;
    requestSong({
      name: searchQuery,
      artist: "Unknown Artist",
      url: "",
      imgUrl: "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionState) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-500" />;
      case "connecting":
        return (
          <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
        );
      case "disconnected":
      case "error":
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        <Navbar
          className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50"
          leftContent={
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="font-mono text-sm font-semibold tracking-wider">
                {code}
              </span>
            </div>
          }
        >
          {error && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              {error}
            </div>
          )}
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
        </Navbar>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Now Playing */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
              >
                {/* Subtle gradient background for depth */}
                <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="relative p-4 sm:p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-accent p-px shadow-lg shadow-primary/20">
                        <div className="w-full h-full bg-card rounded-[11px] flex items-center justify-center">
                          <Radio className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h2 className="font-bold text-lg tracking-tight">
                          Now Playing
                        </h2>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Live from Spotify
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="gap-2 px-3 py-1.5 h-auto rounded-full bg-green-500/10 border-green-500/30 shadow-xs shadow-green-500/10"
                    >
                      <div className="relative flex h-2 w-2">
                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </div>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 tracking-wide uppercase">
                        Live
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="relative p-4 sm:p-6 sm:py-8">
                  {spotifyToken ? (
                    <SpotifyWebPlayer token={spotifyToken} />
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        <Music className="w-12 h-12 text-primary/40" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                        <p className="text-sm text-muted-foreground">
                          Spotify playback is only available to the room admin.
                        </p>
                      </div>
                    </div>
                  )}
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

                <div className="flex flex-col gap-3 sm:flex-row items-center">
                  <Combobox
                    disabled={!isConnected}
                    inputValue={searchQuery}
                    onInputValueChange={setSearchQuery}
                    onValueChange={handleSelectResult}
                  >
                    <ComboboxInput
                      // showTrigger={false}
                      showClear={!!searchQuery}
                      placeholder="Search for a song..."
                      className="w-full rounded-xl"
                    />
                    <ComboboxContent hidden={!searchQuery}>
                      <ComboboxList>
                        {searchLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          </div>
                        ) : (
                          <>
                            {searchResults.length === 0 && (
                              <ComboboxEmpty>No songs found.</ComboboxEmpty>
                            )}
                            {searchResults.map((result) => (
                              <ComboboxItem key={result.id} value={result.id}>
                                {result.imgUrl ? (
                                  <Image
                                    src={result.imgUrl}
                                    alt={result.album}
                                    className="w-8 h-8 rounded-md object-cover shrink-0"
                                    width={32}
                                    height={32}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    <Music className="w-3.5 h-3.5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {result.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {result.artist} · {result.album}
                                  </p>
                                </div>
                              </ComboboxItem>
                            ))}
                          </>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleRequestSong}
                      disabled={!isConnected || !searchQuery.trim()}
                      className="h-auto rounded-xl bg-linear-to-r from-accent to-accent/80 px-2 sm:px-4 py-2 sm:py-2 font-semibold text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-accent/30"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="sm:inline">Add</span>
                    </Button>
                  </motion.div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {roomConfig?.autoApprove
                    ? "Songs are automatically approved and added to the queue."
                    : "Requests require admin approval before appearing in the queue."}
                </p>
              </motion.section>

              {/* Pending Requests (Admin Only) */}
              {isAdmin && pendingRequests.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Pending Requests</h3>
                      <p className="text-xs text-muted-foreground">
                        Approve or reject song requests
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pendingRequests.map((song) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-background/50"
                      >
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-primary/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {song.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {song.artist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={() => approveSong(song.id)}
                              variant="outline"
                              className="h-auto rounded-lg bg-green-500/10 hover:bg-green-500/20 px-2 py-1.5 text-xs font-medium text-green-600"
                              type="button"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={() => rejectSong(song.id)}
                              variant="outline"
                              className="h-auto rounded-lg bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-600"
                              type="button"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
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

                <div className="p-3 space-y-2 max-h-80 sm:max-h-100 overflow-y-auto">
                  {queue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No songs in queue</p>
                      <p className="text-xs">Request a song to get started!</p>
                    </div>
                  ) : (
                    queue.map((song, index) => (
                      <motion.div
                        key={song.id}
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
                              {song.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => upvoteSong(song.id)}
                                disabled={!isConnected}
                                variant="outline"
                                className="h-auto rounded-lg bg-primary/10 hover:bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
                                type="button"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {song.upvotes}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
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
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-1 h-auto rounded-full bg-primary/10 border-primary/20 text-primary font-medium"
                  >
                    {users.length} online
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {users.map((u) => {
                    const isSelf = u.userId === user.userId;
                    return (
                      <div
                        key={u.userId}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium">
                          {u.username}
                          {isSelf && " (you)"}
                        </span>
                        {u.isAdmin && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
