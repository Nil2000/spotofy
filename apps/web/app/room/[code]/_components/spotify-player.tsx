"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type SpotifyPlayer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: (event: string, cb: (arg: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
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

export default function SpotifyWebPlayer({ token }: Props) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const tokenRef = useRef<string>(token);
  const [isPaused, setPaused] = useState(false);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

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
      <div className="container">
        <div className="main-wrapper">
          <p>Waiting for Spotify to be active on this device...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-wrapper">
        <Image
          src={currentTrack.album.images[0]?.url ?? ""}
          className="now-playing__cover"
          alt=""
          width={300}
          height={300}
        />
        <div className="now-playing__side">
          <div className="now-playing__name">{currentTrack.name}</div>
          <div className="now-playing__artist">
            {currentTrack.artists[0]?.name}
          </div>
          <div className="now-playing__status">
            {isPaused ? "Paused" : "Playing"}
          </div>
        </div>
      </div>
    </div>
  );
}
