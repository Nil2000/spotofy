import { useEffect, useRef, useState, useCallback } from "react";
import {
  CLIENT_TO_SERVER_MESSAGE_TYPES,
  SERVER_TO_CLIENT_MESSAGE_TYPES,
} from "@/lib/constants";
import type {
  UserPayload,
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
  const [users, setUsers] = useState<UserPayload[]>([]);
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
        case SERVER_TO_CLIENT_MESSAGE_TYPES.LIST_USERS: {
          setUsers(message.payload.users);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.JOINED_ROOM: {
          setJoinState("joined");
          setJoinError(null);
          setRoomConfig(message.payload.config);
          setQueue(message.payload.queue);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_NOT_JOINED: {
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

        case SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_JOINED: {
          setIsAdminJoined(true);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_LEFT: {
          setIsAdminJoined(false);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.QUEUE_UPDATE: {
          setQueue(message.payload.queue);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REQUESTED: {
          setPendingRequests((prev) => [...prev, message.payload.song]);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_APPROVED: {
          setPendingRequests((prev) =>
            prev.filter((song) => song.id !== message.payload.songId),
          );
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REJECTED: {
          setPendingRequests((prev) =>
            prev.filter((song) => song.id !== message.payload.songId),
          );
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.USERS_REQUESTED_LIST: {
          setPendingUsers(message.payload.users);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.JOIN_REQUESTED: {
          setPendingUsers((prev) => {
            if (prev.some((u) => u.userId === message.payload.userId)) {
              return prev;
            }
            return [...prev, message.payload];
          });
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE: {
          setNowPlaying(message.payload.song);
          break;
        }

        case SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR: {
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
    (roomId: string, user: UserPayload) => {
      setJoinState("joining");
      setJoinError(null);
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.JOIN_ROOM,
        payload: { roomId, user },
      });
    },
    [sendMessage],
  );

  const requestSong = useCallback(
    (song: SongPayload) => {
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.REQUEST_SONG,
        payload: { song },
      });
    },
    [sendMessage],
  );

  const upvoteSong = useCallback(
    (songId: string, userId: string) => {
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.UPVOTE_SONG,
        payload: { songId, userId },
      });
    },
    [sendMessage],
  );

  const approveSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_SONG,
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const rejectSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_SONG,
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const approveUser = useCallback(
    (userId: string, username: string) => {
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_USER,
        payload: { userId, username },
      });
    },
    [sendMessage],
  );

  const rejectUser = useCallback(
    (userId: string, username: string) => {
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
      sendMessage({
        type: CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_USER,
        payload: { userId, username },
      });
    },
    [sendMessage],
  );

  const broadcastNowPlaying = useCallback(() => {
    sendMessage({ type: CLIENT_TO_SERVER_MESSAGE_TYPES.BROADCAST_NOW_PLAYING });
  }, [sendMessage]);

  const requestNextSong = useCallback(() => {
    sendMessage({ type: CLIENT_TO_SERVER_MESSAGE_TYPES.NEXT_SONG });
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
