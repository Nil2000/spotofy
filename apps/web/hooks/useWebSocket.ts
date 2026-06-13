import { useEffect, useRef, useState, useCallback } from "react";
import {
  ClientEvents,
  ServerEvents,
} from "@/lib/constants";
import type {
  RoomConfig,
  SongData,
  SongPayload,
  ClientMessage,
  ServerMessage,
  ConnectionState,
  JoinState,
  UserShortPayload,
  UserPayload,
} from "@/types/websocket";
import { toast } from "@repo/ui/components/ui/sonner";
import { ClientMessageSchema, ServerMessageSchema } from "@/types/websocket";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

async function fetchWsToken(roomId: string): Promise<string | null> {
  const res = await fetch(
    `/api/ws/token?roomId=${encodeURIComponent(roomId)}`,
    { credentials: "include" },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { token?: string };
  return data.token ?? null;
}

export function useWebSocket(roomId: string, userId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const currentUserIdRef = useRef(userId);
  const currentRoomIdRef = useRef(roomId);
  const shouldReconnectRef = useRef(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const joinStateRef = useRef<JoinState>("idle");
  const connectRef = useRef<() => void>(() => {});

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
  const [upvotesUsed, setUpvotesUsed] = useState(0);

  currentUserIdRef.current = userId;
  currentRoomIdRef.current = roomId;

  const setJoinStateAndRef = useCallback((next: JoinState | ((prev: JoinState) => JoinState)) => {
    setJoinState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      joinStateRef.current = value;
      return value;
    });
  }, []);

  const reportError = useCallback(
    (message: string, details?: unknown, toastId?: string) => {
      toast.error(message, toastId ? { id: toastId } : undefined);

      if (details) {
        console.error(message, details);
      }
    },
    [],
  );

  const sendJoinMessage = useCallback((ws: WebSocket, targetRoomId: string) => {
    setJoinStateAndRef("joining");
    ws.send(
      JSON.stringify({
        type: ClientEvents.JOIN_ROOM,
        payload: { roomId: targetRoomId },
      }),
    );
  }, [setJoinStateAndRef]);

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case ServerEvents.MEMBERS_UPDATED: {
          setUsers(message.payload.users);
          break;
        }

        case ServerEvents.ROOM_JOINED: {
          setJoinStateAndRef("joined");
          setJoinError(null);
          setRoomConfig(message.payload.config);
          setUpvotesUsed(message.payload.upvotesUsed);
          break;
        }

        case ServerEvents.ROOM_USER_LIMIT_REACHED: {
          setJoinStateAndRef("full");
          setJoinError(
            `This room is full (${message.payload.maxUsers} users max). Try again later.`,
          );
          setRoomConfig(null);
          setQueue([]);
          setPendingRequests([]);
          setPendingUsers([]);
          setUsers([]);
          setNowPlaying(null);
          setUpvotesUsed(0);
          break;
        }

        case ServerEvents.ROOM_UPVOTE_LIMIT_REACHED: {
          reportError(
            `You've used all ${message.payload.maxUpvotes} upvotes for this room`,
            undefined,
            "websocket-upvote-limit",
          );
          break;
        }

        case ServerEvents.USER_UPVOTES_USAGE: {
          setUpvotesUsed(message.payload.used);
          break;
        }

        case ServerEvents.WAITING_FOR_ADMIN: {
          setJoinStateAndRef("blocked");
          setJoinError(null);
          setRoomConfig(null);
          setQueue([]);
          setPendingRequests([]);
          setUsers([]);
          setNowPlaying(null);
          setIsAdminJoined(false);
          break;
        }

        case ServerEvents.USER_REJECTED: {
          setJoinStateAndRef("rejected");
          setJoinError(message.payload.message);
          setRoomConfig(null);
          setQueue([]);
          setPendingRequests([]);
          setPendingUsers([]);
          setUsers([]);
          setNowPlaying(null);
          setIsAdminJoined(false);
          break;
        }

        case ServerEvents.JOIN_ALREADY_PENDING: {
          setJoinStateAndRef("joining");
          setJoinError(null);
          break;
        }

        case ServerEvents.ADMIN_JOINED: {
          setIsAdminJoined(true);
          setJoinStateAndRef((prev) => (prev === "blocked" ? "joining" : prev));
          break;
        }

        case ServerEvents.ADMIN_LEFT: {
          setIsAdminJoined(false);
          setJoinStateAndRef((prev) => (prev === "joining" ? "blocked" : prev));
          break;
        }

        case ServerEvents.QUEUE_UPDATED: {
          setQueue(message.payload.queue);
          break;
        }

        case ServerEvents.SONG_REQUESTED: {
          setPendingRequests((prev) => [...prev, message.payload.song]);
          break;
        }

        case ServerEvents.SONG_REQUEST_SUBMITTED: {
          toast.success("Song submitted for approval");
          break;
        }

        case ServerEvents.SONG_APPROVED: {
          setPendingRequests((prev) =>
            prev.filter((song) => song.id !== message.payload.songId),
          );
          break;
        }

        case ServerEvents.SONG_REJECTED: {
          setPendingRequests((prev) =>
            prev.filter((song) => song.id !== message.payload.songId),
          );
          if (
            message.payload.requestedByUserId &&
            message.payload.requestedByUserId === currentUserIdRef.current
          ) {
            toast.error(
              `"${message.payload.name}" by ${message.payload.artist} was not approved`,
            );
          }
          break;
        }

        case ServerEvents.PENDING_JOIN_REQUESTS: {
          setPendingUsers(message.payload.users);
          break;
        }

        case ServerEvents.PENDING_SONG_REQUESTS: {
          setPendingRequests(message.payload.songs);
          break;
        }

        case ServerEvents.USER_JOIN_REQUESTED: {
          setPendingUsers((prev) => {
            if (prev.some((u) => u.userId === message.payload.userId)) {
              return prev;
            }
            return [...prev, message.payload];
          });
          break;
        }

        case ServerEvents.NOW_PLAYING_UPDATED: {
          setNowPlaying(message.payload.song);
          break;
        }

        case ServerEvents.ERROR: {
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
    [reportError, setJoinStateAndRef],
  );

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState("connecting");

    try {
      const token = await fetchWsToken(roomId);
      if (!token) {
        setConnectionState("error");
        reportError(
          "Failed to authenticate WebSocket connection",
          undefined,
          "websocket-auth-error",
        );
        return;
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const ws = new WebSocket(
        `${wsUrl}?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setConnectionState("connected");
        console.log("WebSocket connected");

        if (currentRoomIdRef.current) {
          sendJoinMessage(ws, currentRoomIdRef.current);
        }
      };

      ws.onmessage = (event) => {
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

      ws.onclose = () => {
        setConnectionState("disconnected");
        console.log("WebSocket disconnected");

        const terminal =
          joinStateRef.current === "rejected" || joinStateRef.current === "full";
        if (!shouldReconnectRef.current || terminal) return;

        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(
          RECONNECT_BASE_MS * Math.pow(2, attempt),
          RECONNECT_MAX_MS,
        );
        reconnectAttemptRef.current = attempt + 1;
        console.log(`Reconnecting in ${delay}ms (attempt ${attempt + 1})`);
        reconnectTimerRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) connectRef.current();
        }, delay);
      };

      ws.onerror = (err) => {
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
  }, [handleServerMessage, reportError, roomId, sendJoinMessage]);

  connectRef.current = connect;

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
    (targetRoomId: string) => {
      currentRoomIdRef.current = targetRoomId;
      setJoinError(null);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendJoinMessage(wsRef.current, targetRoomId);
      }
    },
    [sendJoinMessage],
  );

  const requestSong = useCallback(
    (song: SongPayload) => {
      sendMessage({
        type: ClientEvents.REQUEST_SONG,
        payload: { song },
      });
    },
    [sendMessage],
  );

  const upvoteSong = useCallback(
    (songId: string, upvoteUserId: string) => {
      sendMessage({
        type: ClientEvents.UPVOTE_SONG,
        payload: { songId, userId: upvoteUserId },
      });
    },
    [sendMessage],
  );

  const approveSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: ClientEvents.APPROVE_SONG,
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const rejectSong = useCallback(
    (songId: string) => {
      sendMessage({
        type: ClientEvents.REJECT_SONG,
        payload: { songId },
      });
    },
    [sendMessage],
  );

  const approveUser = useCallback(
    (approveUserId: string, username: string) => {
      sendMessage({
        type: ClientEvents.APPROVE_USER,
        payload: { userId: approveUserId, username },
      });
    },
    [sendMessage],
  );

  const rejectUser = useCallback(
    (rejectUserId: string, username: string) => {
      sendMessage({
        type: ClientEvents.REJECT_USER,
        payload: { userId: rejectUserId, username },
      });
    },
    [sendMessage],
  );

  const broadcastNowPlaying = useCallback(() => {
    sendMessage({ type: ClientEvents.SYNC_NOW_PLAYING });
  }, [sendMessage]);

  const requestNextSong = useCallback(() => {
    sendMessage({ type: ClientEvents.SKIP_TO_NEXT });
  }, [sendMessage]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const maxUpvotes = roomConfig?.maxUpvotes ?? 0;
  const canUpvote = joinState === "joined" && upvotesUsed < maxUpvotes;

  return {
    connectionState,
    joinState,
    joinError,
    isAdminJoined,
    isConnected: connectionState === "connected",
    roomConfig,
    queue,
    pendingRequests,
    pendingUsers,
    upvotesUsed,
    canUpvote,
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
