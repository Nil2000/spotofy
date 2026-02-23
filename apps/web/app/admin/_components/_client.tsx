"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
import {
  Users,
  Radio,
  Copy,
  ExternalLink,
  Shield,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { FaSpotify } from "react-icons/fa";
import { Label } from "@repo/ui/components/ui/label";
import { Input } from "@repo/ui/components/ui/input";
import { Switch } from "@repo/ui/components/ui/switch";
import Navbar from "@/components/navbar";

type Room = {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  userCount: number;
  isActive: boolean;
  autoApprove: boolean;
};

export default function AdminClient({
  isSpotifyConnected,
}: {
  isSpotifyConnected: boolean;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const rooms: Room[] = [
    {
      id: "1",
      code: "PQ-7H2K",
      name: "Friday Night Vibes",
      createdAt: "2h ago",
      userCount: 12,
      isActive: true,
      autoApprove: false,
    },
    {
      id: "2",
      code: "PQ-3X9M",
      name: "Chill Study Session",
      createdAt: "1d ago",
      userCount: 0,
      isActive: false,
      autoApprove: true,
    },
    {
      id: "3",
      code: "PQ-5K1R",
      name: "Weekend Party Mix",
      createdAt: "3d ago",
      userCount: 0,
      isActive: false,
      autoApprove: false,
    },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateRoom = () => {
    setRoomName("");
    setAutoApprove(false);
    setShowCreateDialog(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-background to-background pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10">
        <Navbar
          className="p-4 sm:p-6 flex items-center justify-between"
          containerClassName="w-full"
        >
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
          {isSpotifyConnected ? (
            <Button
              className="border-green-500/40 bg-green-500/15 text-green-600 hover:bg-green-500/25"
              variant="outline"
              disabled
            >
              <FaSpotify className="h-4 w-4" />
              <span className="hidden sm:inline">Spotify Connected</span>
            </Button>
          ) : (
            <Link href="/api/spotify/connect">
              <Button
                className="bg-green-500 text-white hover:bg-green-700/90"
                variant="outline"
              >
                <FaSpotify className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Spotify</span>
              </Button>
            </Link>
          )}
        </Navbar>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <Badge
                variant="outline"
                className="inline-flex items-center gap-2 px-4 py-2 h-auto rounded-full bg-primary/10 border-primary/20 text-primary text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Badge>
            </motion.div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Your{" "}
                  <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                    Rooms
                  </span>
                </h1>
                <p className="text-muted-foreground text-base max-w-md">
                  Create and manage your music rooms. Enter a room to control
                  playback and moderate requests.
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="h-auto rounded-xl bg-linear-to-r from-primary to-primary/80 px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all shrink-0"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  Create Room
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Spotify warning banner */}
          {!isSpotifyConnected && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
            >
              <FaSpotify className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-600">
                Connect Spotify to enable playback in your rooms.{" "}
                <Link
                  href="/api/spotify/connect"
                  className="font-semibold underline underline-offset-2"
                >
                  Connect now
                </Link>
              </p>
            </motion.div>
          )}

          {/* Rooms List */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {rooms.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="group rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-5 shadow-xl hover:border-primary/30 hover:shadow-primary/5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Room icon + info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        <Radio className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">
                            {room.name}
                          </h3>
                          {room.isActive && (
                            <Badge
                              variant="outline"
                              className="gap-1.5 px-2 py-0.5 h-auto rounded-full bg-green-500/10 border-green-500/20 text-green-600 text-xs font-medium shrink-0"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Live
                            </Badge>
                          )}
                          {room.autoApprove && (
                            <Badge
                              variant="outline"
                              className="gap-1 px-2 py-0.5 h-auto rounded-full bg-primary/10 border-primary/20 text-primary text-xs font-medium shrink-0"
                            >
                              <Sparkles className="w-3 h-3" />
                              Auto-approve
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono font-semibold tracking-wider text-foreground/70">
                            {room.code}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {room.createdAt}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.userCount} online
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopyCode(room.code)}
                        className="rounded-lg text-muted-foreground hover:text-foreground"
                        type="button"
                      >
                        {copiedCode === room.code ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Link href={`/room/${room.code}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg gap-1.5 text-xs font-medium"
                          type="button"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Room
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {rooms.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-7 h-7 text-primary/50" />
                </div>
                <h3 className="font-semibold mb-1">No rooms yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first room to get started.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="h-auto rounded-xl bg-linear-to-r from-primary to-primary/80 px-5 py-2.5 font-semibold text-primary-foreground"
                  type="button"
                  variant={"outline"}
                >
                  <Plus className="w-4 h-4" />
                  Create Room
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Footer hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-xs text-muted-foreground"
          >
            <Link
              href="/join"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Join a room instead
            </Link>{" "}
            &mdash; Spotify Premium required for playback
          </motion.p>
        </div>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Radio className="w-4 h-4 text-primary" />
              </div>
              Create a New Room
            </DialogTitle>
            <DialogDescription>
              Set up a new music room. Share the room code with your guests so
              they can join and request songs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Friday Night Vibes"
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Auto-approve songs</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Skip manual approval for song requests
                </p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />A unique
              room code will be generated automatically.
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="rounded-xl"
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoom}
              disabled={!roomName.trim()}
              className="rounded-xl bg-linear-to-r from-primary to-primary/80 font-semibold text-primary-foreground shadow-lg shadow-primary/20"
              type="button"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
