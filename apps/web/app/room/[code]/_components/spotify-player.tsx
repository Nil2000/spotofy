"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@repo/ui/components/ui/button";
import { Slider } from "@repo/ui/components/ui/slider";
import {
  Volume2,
  MonitorSmartphone,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react";

type SpotifyPlayer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: (event: string, cb: (arg: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  togglePlay: () => void;
  nextTrack: () => void;
  setVolume: (volume: number) => Promise<void>;
};

type SpotifyPlaybackState = {
  paused: boolean;
  track_window: { current_track: SpotifyTrack };
};

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type SpotifyTrack = {
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

type Props = {
  token: string;
  onReady?: () => void;
  nowPlayingUrl?: string | null;
};

async function fetchFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/spotify/token");
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export default function SpotifyWebPlayer({
  token,
  onReady,
  nowPlayingUrl,
}: Props) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string>(token);
  const deviceIdRef = useRef<string | null>(null);
  const onReadyRef = useRef(onReady);
  const [isPaused, setPaused] = useState(false);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!nowPlayingUrl || !deviceIdRef.current) return;
    const play = async () => {
      const fresh = await fetchFreshToken();
      const accessToken = fresh ?? tokenRef.current;
      await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [nowPlayingUrl] }),
        },
      );
    };
    play().catch(console.error);
  }, [nowPlayingUrl]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: async (cb: (token: string) => void) => {
          const fresh = await fetchFreshToken();
          const resolved = fresh ?? tokenRef.current;
          tokenRef.current = resolved;
          cb(resolved);
        },
        volume: 0.5,
      });

      playerRef.current = player;

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id);
        deviceIdRef.current = device_id;
        onReadyRef.current?.();
      });

      player.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id);
        },
      );

      player.addListener("player_state_changed", (state) => {
        const s = state as SpotifyPlaybackState | null;
        if (!s) {
          setActive(false);
          return;
        }
        setCurrentTrack(s.track_window.current_track);
        setPaused(s.paused);
        player.getCurrentState().then((currentState) => {
          setActive(!!currentState);
        });
      });

      player.addListener("authentication_error", (error) => {
        console.error("Authentication error:", error);
      });

      player.connect();
    };

    return () => {
      playerRef.current?.disconnect();
      document.body.removeChild(script);
    };
  }, [token]);

  if (!isActive || !currentTrack) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start p-2">
        <div className="w-full sm:w-32 md:w-40 aspect-square sm:aspect-auto sm:h-32 md:h-40 rounded-xl bg-linear-to-br from-primary/10 to-accent/10 border border-border/50 flex items-center justify-center shrink-0 mx-auto sm:mx-0 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors animate-pulse" />
          <MonitorSmartphone className="w-10 h-10 text-primary/40" />
        </div>
        <div className="flex-1 flex flex-col justify-center text-center sm:text-left gap-3 sm:py-2">
          <div>
            <h3 className="text-lg font-semibold mb-1">Player Ready</h3>
            <p className="text-sm text-muted-foreground">
              To start playing music here, open the Spotify app on your phone or
              computer, go to devices, and select{" "}
              <span className="font-semibold text-foreground">
                Web Playback SDK
              </span>
              .
            </p>
          </div>
          <div className="flex justify-center sm:justify-start">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Waiting for connection...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8">
      {/* Album Art with depth */}
      <div className="relative shrink-0 group mx-auto md:mx-0">
        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-colors" />
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden ring-1 ring-border/50 shadow-2xl shadow-black/40">
          <Image
            src={currentTrack.album.images[0]?.url ?? ""}
            alt={currentTrack.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 224px, 256px"
          />
        </div>
      </div>

      {/* Player Controls & Info */}
      <div className="flex-1 flex flex-col justify-center text-center md:text-left min-w-0 w-full">
        <div className="space-y-2 mb-6 md:mb-8">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight truncate bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent pb-1">
            {currentTrack.name}
          </h3>
          <p className="text-base sm:text-lg text-muted-foreground font-medium truncate">
            {currentTrack.artists.map((a) => a.name).join(", ")}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-card/40 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
          {/* Main Controls */}
          <div className="flex items-center gap-4">
            <Button
              className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/25 shrink-0 transition-transform hover:scale-105 active:scale-95"
              type="button"
              onClick={() => playerRef.current?.togglePlay()}
            >
              {isPaused ? <Play /> : <Pause />}
            </Button>

            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 shadow-xs"
              type="button"
              onClick={() => playerRef.current?.nextTrack()}
            >
              <ChevronRight />
            </Button>
          </div>

          <div className="h-8 w-px bg-border/50 hidden sm:block mx-2" />

          {/* Volume Control */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-50">
            <Volume2 className="w-5 h-5 text-muted-foreground shrink-0" />
            <Slider
              className="cursor-pointer"
              defaultValue={[0.5]}
              max={1}
              step={0.01}
              onValueChange={(val) => {
                if (Array.isArray(val) && val.length > 0) {
                  playerRef.current?.setVolume(val[0]);
                } else if (typeof val === "number") {
                  playerRef.current?.setVolume(val);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
