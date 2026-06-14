import type { WebSocket } from "ws";
import { ServerEvents } from "../constants";
import { getRoom } from "../lib/context";
import { getJoinedConnection } from "../lib/guards";
import { sendQueueUpdate } from "../lib/join-helpers";
import {
  broadcastToRoom,
  send,
  sendToAdmin,
  sendUserUpvotesUsage,
} from "../lib/messaging";
import type {
  ApproveSongMessage,
  RejectSongMessage,
  RequestSongMessage,
  UpvoteSongMessage,
} from "../types";

export async function handleRequestSong(
  ws: WebSocket,
  msg: RequestSongMessage,
) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  const result = await room.requestSong(msg.payload.song, conn.user!.userId);

  if (result === "duplicate") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: {
        message: "This song is already in the queue or pending approval",
      },
    });
  }

  const songData = result;

  if (room.isAutoApproveSongs()) {
    await sendQueueUpdate(conn.roomId, room);
    const { song, started } = await room.promoteNextIfIdle();
    if (started) {
      broadcastToRoom(conn.roomId, {
        type: ServerEvents.NOW_PLAYING_UPDATED,
        payload: { song },
      });
    }
  } else {
    send(conn.ws, {
      type: ServerEvents.SONG_REQUEST_SUBMITTED,
      payload: { song: songData },
    });
    sendToAdmin(conn.roomId, room, {
      type: ServerEvents.SONG_REQUESTED,
      payload: { song: songData },
    });
  }
}

export async function handleUpvote(ws: WebSocket, msg: UpvoteSongMessage) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (msg.payload.userId !== conn.user!.userId) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Invalid upvote user" },
    });
  }

  const result = await room.upvote(msg.payload.songId, conn.user!.userId);
  if (result === "success") {
    await sendUserUpvotesUsage(ws, room, conn.user!.userId);
    return await sendQueueUpdate(conn.roomId, room);
  }

  if (result === "upvote_limit_reached") {
    return send(ws, {
      type: ServerEvents.ROOM_UPVOTE_LIMIT_REACHED,
      payload: { maxUpvotes: room.getConfig().maxUpvotes },
    });
  }

  if (result === "already_upvoted") {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "You have already upvoted this song in this room" },
    });
  }

  return send(ws, {
    type: ServerEvents.ERROR,
    payload: { message: "Song not found in queue" },
  });
}

export async function handleApproveSong(
  ws: WebSocket,
  msg: ApproveSongMessage,
) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user!.userId !== room.getAdminId()) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Only admin can approve songs" },
    });
  }

  const success = await room.approveSong(msg.payload.songId);
  if (!success) {
    send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Song not found in requests" },
    });
    return;
  }

  broadcastToRoom(conn.roomId, {
    type: ServerEvents.SONG_APPROVED,
    payload: { songId: msg.payload.songId },
  });

  const { song, started } = await room.promoteNextIfIdle();
  if (started) {
    broadcastToRoom(conn.roomId, {
      type: ServerEvents.NOW_PLAYING_UPDATED,
      payload: { song },
    });
  }

  await sendQueueUpdate(conn.roomId, room);
}

export async function handleRejectSong(ws: WebSocket, msg: RejectSongMessage) {
  const ctx = getJoinedConnection(ws);
  if (!ctx) return;

  const { conn } = ctx;

  const room = getRoom(conn.roomId);
  if (!room) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Room not found" },
    });
  }

  if (conn.user!.userId !== room.getAdminId()) {
    return send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Only admin can reject songs" },
    });
  }

  const success = await room.rejectSong(msg.payload.songId);
  if (success) {
    broadcastToRoom(conn.roomId, {
      type: ServerEvents.SONG_REJECTED,
      payload: {
        songId: success.id,
        name: success.name,
        artist: success.artist,
        requestedByUserId: success.requestedByUserId,
      },
    });
  } else {
    send(ws, {
      type: ServerEvents.ERROR,
      payload: { message: "Song not found in requests" },
    });
  }
}
