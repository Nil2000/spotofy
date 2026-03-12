import { motion } from "motion/react";
import { Badge } from "@repo/ui/components/ui/badge";
import { MonitorSmartphone, Music, Radio } from "lucide-react";
import Image from "next/image";

import type { SongData } from "@/types/websocket";
import SpotifyWebPlayer from "./spotify-player";

type NowPlayingSectionProps = {
  isAdmin: boolean;
  spotifyToken: string | null;
  nowPlaying: SongData | null;
  requestNextSong: () => void;
};

export default function NowPlayingSection({
  isAdmin,
  spotifyToken,
  nowPlaying,
  requestNextSong,
}: NowPlayingSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5"
    >
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
              <h2 className="font-bold text-lg tracking-tight">Now Playing</h2>
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
        {isAdmin ? (
          spotifyToken ? (
            nowPlaying?.url ? (
              <SpotifyWebPlayer
                token={spotifyToken}
                nowPlayingUrl={nowPlaying.url}
                onSongEnd={requestNextSong}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <Music className="w-12 h-12 text-primary/40" />
                </div>
                <div className="flex-1 flex flex-col justify-center text-center sm:text-left gap-2">
                  <p className="text-base font-semibold">No song available to play</p>
                  <p className="text-sm text-muted-foreground">
                    The queue is empty. Add songs to the queue to start playback.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                <Music className="w-12 h-12 text-primary/40" />
              </div>
              <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                <p className="text-sm text-muted-foreground">
                  Connect your Spotify account to start playing music.
                </p>
              </div>
            </div>
          )
        ) : nowPlaying ? (
          <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8">
            <div className="relative shrink-0 group mx-auto md:mx-0">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors" />
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden ring-1 ring-border/50 shadow-2xl shadow-black/40">
                {nowPlaying.imgUrl ? (
                  <Image
                    src={nowPlaying.imgUrl}
                    alt={nowPlaying.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 224px, 256px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Music className="w-16 h-16 text-primary/30" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center md:text-left min-w-0 w-full gap-4">
              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight truncate bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-1">
                  {nowPlaying.name}
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground font-medium truncate">
                  {nowPlaying.artist}
                </p>
              </div>
              <div className="inline-flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 w-fit mx-auto md:mx-0">
                <MonitorSmartphone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">
                  Playing on admin&apos;s device
                </span>
                <div className="flex items-end gap-0.5 h-4 ml-1">
                  <div
                    className="w-1 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_infinite]"
                    style={{ height: "60%" }}
                  />
                  <div
                    className="w-1 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_0.2s_infinite]"
                    style={{ height: "100%" }}
                  />
                  <div
                    className="w-1 bg-primary rounded-full animate-[equalizer_0.8s_ease-in-out_0.4s_infinite]"
                    style={{ height: "40%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
              <Music className="w-12 h-12 text-primary/40" />
            </div>
            <div className="flex-1 flex flex-col justify-center text-center sm:text-left gap-2">
              <p className="text-base font-semibold">Nothing playing yet</p>
              <p className="text-sm text-muted-foreground">
                The admin hasn&apos;t started playing music on their device yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
