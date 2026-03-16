import { useEffect, useRef, useState, useCallback } from "react";
import type {
  JWTPayload,
  RoomConfig,
  SongData,
  SongPayload,
  ClientMessage,
  ServerMessage,
  ConnectionState,
  JoinState,
  UserShortPayload,
} from "@/types/websocket";
import { toast } from "@repo/ui/components/ui/sonner";
import { ClientMessageSchema, ServerMessageSchema } from "@/types/websocket";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [joinState, setJoinState] = useState<JoinState>("idle");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SongData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserShortPayload[]>([]);
  const [users, setUsers] = useState<JWTPayload[]>([]);
  const [nowPlaying, setNowPlaying] = useState<SongData | null>(null);
  const [isAdminJoined, setIsAdminJoined] = useState(false);

  const reportError = useCallback(
    (message: string, details?: unknown, toastId?: string) => {
      toast.error(message, toastId ? { id: toastId } : undefined);

      if (details) {
        console.error(message, details);
      }
    },
    [],
  );

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "list_users": {
          setUsers(message.payload.users);
          break;
        }

        case "joined_room": {
          setJoinState("joined");
          setJoinError(null);
          setRoomConfig(message.payload.config);
          setQueue(message.payload.queue);
          break;
        }

        case "admin_not_joined": {
          setJoinState("blocked");
          setJoinError("Admin has not joined yet.");
          setRoomConfig(null);
          setQueue([]);
          setPendingRequests([]);
          setUsers([]);
          setNowPlaying(null);
          setIsAdminJoined(false);
          break;
        }

        case "admin_joined": {
          setIsAdminJoined(true);
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

        case "users_requested_list": {
          setPendingUsers(message.payload.users);
          break;
        }

        case "join_requested": {
          setPendingUsers((prev) => {
            if (prev.some((u) => u.userId === message.payload.userId)) {
              return prev;
            }
            return [...prev, message.payload];
          });
          break;
        }

        case "now_playing_update": {
          setNowPlaying(message.payload.song);
          break;
        }

        case "error": {
          reportError(
            message.payload.message,
            undefined,
            "websocket-server-error",
          );
          break;
        }

        default: {
          console.warn(
            "Unknown message type:",
            (message as { type: string }).type,
          );
        }
      }
    },
    [reportError],
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState("connecting");

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionState("connected");
        console.log("WebSocket connected");

        // // Rejoin room if we were in one
        // if (currentRoomId) {
        //   // Note: User needs to be passed, this is handled by joinRoom
        // }
      };

      wsRef.current.onmessage = (event) => {
        try {
          console.log("Received message:", event.data);

          const parsedMessage = ServerMessageSchema.safeParse(
            JSON.parse(event.data),
          );

          if (!parsedMessage.success) {
            reportError(
              "Received an invalid server message",
              parsedMessage.error,
              "websocket-invalid-message",
            );
            return;
          }

          handleServerMessage(parsedMessage.data);
        } catch (err) {
          reportError(
            "Failed to parse a server message",
            err,
            "websocket-parse-error",
          );
        }
      };

      wsRef.current.onclose = () => {
        setConnectionState("disconnected");
        console.log("WebSocket disconnected");
      };

      wsRef.current.onerror = (err) => {
        setConnectionState("error");
        reportError(
          "WebSocket connection error",
          err,
          "websocket-connection-error",
        );
      };
    } catch (err) {
      setConnectionState("error");
      reportError(
        "Failed to create WebSocket connection",
        err,
        "websocket-create-error",
      );
    }
  }, [handleServerMessage, reportError]);

  const sendMessage = useCallback(
    (message: ClientMessage) => {
      const parsedMessage = ClientMessageSchema.safeParse(message);

      if (!parsedMessage.success) {
        reportError(
          "Invalid WebSocket message",
          parsedMessage.error,
          "websocket-outgoing-message-error",
        );
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(parsedMessage.data));
      } else {
        reportError(
          "WebSocket is not connected",
          undefined,
          "websocket-not-connected",
        );
      }
    },
    [reportError],
  );

  const joinRoom = useCallback(
    (roomId: string, user: JWTPayload) => {
      setJoinState("joining");
      setJoinError(null);
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
    (songId: string, userId: string) => {
      sendMessage({
        type: "upvote_song",
        payload: { songId, userId },
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

  const approveUser = useCallback(
    (userId: string, username: string) => {
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
      sendMessage({
        type: "approve_user",
        payload: { userId, username },
      });
    },
    [sendMessage],
  );

  const rejectUser = useCallback(
    (userId: string, username: string) => {
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
      sendMessage({
        type: "reject_user",
        payload: { userId, username },
      });
    },
    [sendMessage],
  );

  const broadcastNowPlaying = useCallback(() => {
    sendMessage({ type: "broadcast_now_playing" });
  }, [sendMessage]);

  const requestNextSong = useCallback(() => {
    sendMessage({ type: "next_song" });
  }, [sendMessage]);

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
    joinState,
    joinError,
    isConnected: connectionState === "connected",
    roomConfig,
    queue,
    pendingRequests,
    pendingUsers,
    joinRoom,
    requestSong,
    upvoteSong,
    approveSong,
    rejectSong,
    approveUser,
    rejectUser,
    broadcastNowPlaying,
    requestNextSong,
    sendMessage,
    users,
    nowPlaying,
  };
}
