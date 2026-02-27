import { useEffect, useRef, useState, useCallback } from "react";
import type {
  JWTPayload,
  RoomConfig,
  SongData,
  SongPayload,
  ClientMessage,
  ServerMessage,
  ConnectionState,
} from "@/types/websocket";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SongData[]>([]);
  const [users, setUsers] = useState<JWTPayload[]>([]);

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "list_users": {
        setUsers(message.payload.users);
        break;
      }

      case "joined_room": {
        setRoomConfig(message.payload.config);
        setQueue(message.payload.queue);
        break;
      }

      case "queue_update": {
        setQueue(message.payload.queue);
        break;
      }

      case "song_requested": {
        setPendingRequests((prev) => [...prev, message.payload.song]);
        break;
      }

      case "song_approved": {
        setPendingRequests((prev) =>
          prev.filter((song) => song.id !== message.payload.songId),
        );
        break;
      }

      case "song_rejected": {
        setPendingRequests((prev) =>
          prev.filter((song) => song.id !== message.payload.songId),
        );
        break;
      }

      case "error": {
        setError(message.payload.message);
        console.error("Server error:", message.payload.message);
        break;
      }

      default: {
        console.warn(
          "Unknown message type:",
          (message as { type: string }).type,
        );
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState("connecting");
    setError(null);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionState("connected");
        setError(null);
        console.log("WebSocket connected");

        // // Rejoin room if we were in one
        // if (currentRoomId) {
        //   // Note: User needs to be passed, this is handled by joinRoom
        // }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionState("disconnected");
        console.log("WebSocket disconnected");
      };

      wsRef.current.onerror = (err) => {
        setConnectionState("error");
        setError("WebSocket connection error");
        console.error("WebSocket error:", err);
      };
    } catch (err) {
      setConnectionState("error");
      setError("Failed to create WebSocket connection");
      console.error("Failed to create WebSocket:", err);
    }
  }, [handleServerMessage]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
      setError("WebSocket is not connected");
    }
  }, []);

  const joinRoom = useCallback(
    (roomId: string, user: JWTPayload) => {
      sendMessage({
        type: "join_room",
        payload: { roomId, user },
      });
    },
    [sendMessage],
  );

  const requestSong = useCallback(
    (song: SongPayload) => {
      sendMessage({
        type: "request_song",
        payload: { song },
      });
    },
    [sendMessage],
  );

  const upvoteSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: "upvote_song",
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const approveSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: "approve_song",
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const rejectSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: "reject_song",
        payload: { songId },
      });
    },
    [sendMessage],
  );

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    error,
    roomConfig,
    queue,
    pendingRequests,
    joinRoom,
    requestSong,
    upvoteSong,
    approveSong,
    rejectSong,
    sendMessage,
    users,
  };
}
