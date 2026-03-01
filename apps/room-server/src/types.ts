import type { SongStatus } from "@repo/db";
import type { WebSocket } from "ws";

export type JWTPayload = {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
};

export type Song = {
  id: string;
  name: string;
  artist: string;
  url: string;
  upvotes: number;
  imgUrl: string;
  songRequestTimeout: NodeJS.Timeout;
};

export type SongPayload = Omit<Song, "songRequestTimeout" | "id" | "upvotes">;

export type SongData = {
  id: string;
  name: string;
  artist: string;
  url: string;
  upvotes: number;
  imgUrl: string;
  status: SongStatus;
};

export type RoomConfig = {
  id: string;
  name: string;
  admin: string;
  maxUpvotes: number;
  maxUsers: number;
  autoApprove: boolean;
};

export type ClientConnection = {
  ws: WebSocket;
  user: JWTPayload | null;
  roomId: string;
};

// --- WS Message Types ---

export type JoinRoomMessage = {
  type: "join_room";
  payload: {
    roomId: string;
    user: JWTPayload;
  };
};

export type RequestSongMessage = {
  type: "request_song";
  payload: {
    song: SongPayload;
  };
};

export type UpvoteSongMessage = {
  type: "upvote_song";
  payload: {
    songId: string;
  };
};

export type ApproveSongMessage = {
  type: "approve_song";
  payload: {
    songId: string;
  };
};

export type RejectSongMessage = {
  type: "reject_song";
  payload: {
    songId: string;
  };
};

export type BroadcastNowPlayingMessage = {
  type: "broadcast_now_playing";
};

export type IncomingMessage =
  | JoinRoomMessage
  | RequestSongMessage
  | UpvoteSongMessage
  | ApproveSongMessage
  | RejectSongMessage
  | BroadcastNowPlayingMessage;

// --- Server -> Client Messages ---

export type QueueUpdateMessage = {
  type: "queue_update";
  payload: {
    queue: SongData[];
  };
};

export type SongRequestedMessage = {
  type: "song_requested";
  payload: {
    song: SongData;
  };
};

export type SongApprovedMessage = {
  type: "song_approved";
  payload: {
    songId: string;
  };
};

export type SongRejectedMessage = {
  type: "song_rejected";
  payload: {
    songId: string;
  };
};

export type ErrorMessage = {
  type: "error";
  payload: {
    message: string;
  };
};

export type JoinedRoomMessage = {
  type: "joined_room";
  payload: {
    roomId: string;
    config: RoomConfig;
    queue: SongData[];
  };
};

export type ListUsersMessage = {
  type: "list_users";
  payload: {
    users: JWTPayload[];
  };
};

export type NowPlayingUpdateMessage = {
  type: "now_playing_update";
  payload: {
    song: SongData | null;
  };
};

export type OutgoingMessage =
  | QueueUpdateMessage
  | SongRequestedMessage
  | SongApprovedMessage
  | SongRejectedMessage
  | ErrorMessage
  | JoinedRoomMessage
  | ListUsersMessage
  | NowPlayingUpdateMessage;
