"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@repo/ui/components/ui/button";
import { Slider } from "@repo/ui/components/ui/slider";
import { toast } from "@repo/ui/components/ui/sonner";
import {
  Volume2,
  MonitorSmartphone,
  Play,
  Pause,
  ChevronRight,
  Repeat,
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
  track_window: {
    previous_tracks: SpotifyTrack[];
    current_track: SpotifyTrack;
  };
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
  id: string;
  uri: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

type Props = {
  token: string;
  onReady?: () => void;
  nowPlayingUrl?: string | null;
  onSongEnd?: () => void;
};

type ExtendedPlaybackState = SpotifyPlaybackState & {
  position: number;
  duration: number;
};

function reportPlayerError(
  message: string,
  details?: unknown,
  toastId?: string,
) {
  toast.error(message, toastId ? { id: toastId } : undefined);

  if (details) {
    console.error(message, details);
    return;
  }

  console.error(message);
}

async function fetchFreshToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/spotify/token");
    if (!res.ok) {
      reportPlayerError(
        "Failed to refresh Spotify token.",
        undefined,
        "spotify-player-token-error",
      );
      return null;
    }
    const data = await res.json();
    return data.accessToken ?? null;
  } catch (error) {
    reportPlayerError(
      "Failed to refresh Spotify token.",
      error,
      "spotify-player-token-error",
    );
    return null;
  }
}

export default function SpotifyWebPlayer({
  token,
  onReady,
  nowPlayingUrl,
  onSongEnd,
}: Props) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string>(token);
  const deviceIdRef = useRef<string | null>(null);
  const nowPlayingUrlRef = useRef<string | null | undefined>(nowPlayingUrl);
  const onReadyRef = useRef(onReady);
  const onSongEndRef = useRef(onSongEnd);
  const [isPaused, setPaused] = useState(false);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const lastEndedTrackIdRef = useRef<string | null>(null);
  const endOfTrackDebounceRef = useRef<NodeJS.Timeout | null>(null);

  tokenRef.current = token;
  nowPlayingUrlRef.current = nowPlayingUrl;
  onReadyRef.current = onReady;
  onSongEndRef.current = onSongEnd;

  const stopRepeat = useCallback(async () => {
    const fresh = await fetchFreshToken();
    const accessToken = fresh ?? tokenRef.current;
    await fetch(
      `https://api.spotify.com/v1/me/player/repeat?state=off&device_id=${deviceIdRef.current}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
  }, []);

  const play = useCallback(async () => {
    const currentNowPlayingUrl = nowPlayingUrlRef.current;
    if (!currentNowPlayingUrl) {
      reportPlayerError(
        "No song is available to play right now.",
        undefined,
        "spotify-player-missing-url",
      );
      return;
    }
    const fresh = await fetchFreshToken();
    const accessToken = fresh ?? tokenRef.current;
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [currentNowPlayingUrl], position_ms: 1 }),
      },
    );

    if (!response.ok) {
      reportPlayerError(
        "Failed to start Spotify playback.",
        undefined,
        "spotify-player-play-error",
      );
    }

    // Disable repeat
    await stopRepeat();
  }, [stopRepeat]);

  async function activateDevice(deviceId: string) {
    const fresh = await fetchFreshToken();
    const accessToken = fresh ?? tokenRef.current;
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });

    if (!response.ok) {
      reportPlayerError(
        "Failed to activate the Spotify player device.",
        undefined,
        "spotify-player-device-error",
      );
    }
  }

  // --- Effects ---
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

      player.addListener(
        "ready",
        async ({ device_id }: { device_id: string }) => {
          console.log("Ready with Device ID", device_id);
          deviceIdRef.current = device_id;
          onReadyRef.current?.();

          await activateDevice(device_id);
        },
      );

      player.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id);
        },
      );

      player.addListener("player_state_changed", async (state) => {
        const s = state as ExtendedPlaybackState | null;
        if (!s) {
          setActive(false);
          return;
        }

        const { paused, position, track_window } = s;
        const { previous_tracks, current_track } = track_window;

        console.log("[SpotifyPlayer] Player state changed:", {
          paused,
          position,
          track_window,
          previous_tracks,
          current_track,
        });

        const trackJustEnded =
          paused &&
          position === 0 &&
          previous_tracks.length > 0 &&
          previous_tracks[0]?.id === current_track.id;

        console.log("Track just ended:", trackJustEnded);
        if (trackJustEnded) {
          if (lastEndedTrackIdRef.current !== current_track.id) {
            lastEndedTrackIdRef.current = current_track.id;

            if (endOfTrackDebounceRef.current)
              clearTimeout(endOfTrackDebounceRef.current);
            endOfTrackDebounceRef.current = setTimeout(() => {
              onSongEndRef.current?.();
            }, 1000);
          }
        } else {
          if (!paused && position > 0) {
            lastEndedTrackIdRef.current = null;
          }
        }

        setCurrentTrack(current_track);
        setPaused(s.paused);
        player.getCurrentState().then((currentState) => {
          // console.log("CURRENT_STATE:", !!currentState);
          setActive(!!currentState);
        });
      });

      player.addListener("authentication_error", (error) => {
        reportPlayerError(
          "Spotify player authentication failed.",
          error,
          "spotify-player-auth-error",
        );
      });

      player.connect();
    };

    return () => {
      playerRef.current?.disconnect();
      document.body.removeChild(script);
    };
  }, [token, play]);

  useEffect(() => {
    console.log("Nowplaying URL:", nowPlayingUrl);
    console.log("Player active status:", isActive);
    if (!nowPlayingUrl || !deviceIdRef.current || !isActive) return;
    play().catch(console.error);
  }, [nowPlayingUrl, isActive, play]);

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
              onClick={() => onSongEndRef.current?.()}
            >
              <ChevronRight />
            </Button>

            <Button
              size="icon"
              variant="secondary"
              className="w-12 h-12 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 shadow-xs"
              type="button"
              onClick={() => stopRepeat()}
            >
              <Repeat className="w-5 h-5" />
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
