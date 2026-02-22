"use client";

import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Spotify: any;
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

export default function SpotifyWebPlayer({ token }: Props) {
  const playerRef = useRef<any>(null);
  const [isPaused, setPaused] = useState(false);
  const [isActive, setActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
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

      player.addListener("player_state_changed", (state: any) => {
        if (!state) {
          setActive(false);
          return;
        }
        setCurrentTrack(state.track_window.current_track);
        setPaused(state.paused);
        player.getCurrentState().then((state: any) => {
          setActive(!!state);
        });
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
        <img
          src={currentTrack.album.images[0]?.url ?? ""}
          className="now-playing__cover"
          alt=""
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
