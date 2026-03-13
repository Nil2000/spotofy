import type { SongStatus } from "@repo/db";

import { z } from "zod";

export const SongStatusSchema = z.enum([
  "REQUESTED",
  "QUEUED",
  "REJECTED",
  "PLAYING",
]) satisfies z.ZodType<SongStatus>;

export const JWTPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.email(),
  username: z.string().min(1),
  isAdmin: z.boolean(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

export const UserShortPayloadSchema = JWTPayloadSchema.omit({
  email: true,
  isAdmin: true,
});

export type UserShortPayload = z.infer<typeof UserShortPayloadSchema>;

export const SongSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  artist: z.string().min(1),
  url: z.url(),
  upvotes: z.number().int().nonnegative(),
  imgUrl: z.url(),
});

export type Song = z.infer<typeof SongSchema>;

export const SongPayloadSchema = SongSchema.omit({
  id: true,
  upvotes: true,
});

export type SongPayload = z.infer<typeof SongPayloadSchema>;

export const SongDataSchema = SongSchema.extend({
  status: SongStatusSchema,
});

export type SongData = z.infer<typeof SongDataSchema>;

export const RoomConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  admin: z.string().min(1),
  maxUpvotes: z.number().int().nonnegative(),
  maxUsers: z.number().int().nonnegative(),
  autoApproveSongs: z.boolean(),
  autoApproveUsers: z.boolean(),
});

export type RoomConfig = z.infer<typeof RoomConfigSchema>;

// --- Client -> Server Messages (Outgoing from client) ---

export const JoinRoomMessageSchema = z.object({
  type: z.literal("join_room"),
  payload: z.object({
    roomId: z.string().min(1),
    user: JWTPayloadSchema,
  }),
});

export type JoinRoomMessage = z.infer<typeof JoinRoomMessageSchema>;

export const RequestSongMessageSchema = z.object({
  type: z.literal("request_song"),
  payload: z.object({
    song: SongPayloadSchema,
  }),
});

export type RequestSongMessage = z.infer<typeof RequestSongMessageSchema>;

export const UpvoteSongMessageSchema = z.object({
  type: z.literal("upvote_song"),
  payload: z.object({
    songId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export type UpvoteSongMessage = z.infer<typeof UpvoteSongMessageSchema>;

export const ApproveSongMessageSchema = z.object({
  type: z.literal("approve_song"),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type ApproveSongMessage = z.infer<typeof ApproveSongMessageSchema>;

export const RejectSongMessageSchema = z.object({
  type: z.literal("reject_song"),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type RejectSongMessage = z.infer<typeof RejectSongMessageSchema>;

export const BroadcastNowPlayingMessageSchema = z.object({
  type: z.literal("broadcast_now_playing"),
});

export type BroadcastNowPlayingMessage = z.infer<
  typeof BroadcastNowPlayingMessageSchema
>;

export const NextSongMessageSchema = z.object({
  type: z.literal("next_song"),
});

export type NextSongMessage = z.infer<typeof NextSongMessageSchema>;

export const ApproveUserMessageSchema = z.object({
  type: z.literal("approve_user"),
  payload: UserShortPayloadSchema,
});

export type ApproveUserMessage = z.infer<typeof ApproveUserMessageSchema>;

export const RejectUserMessageSchema = z.object({
  type: z.literal("reject_user"),
  payload: UserShortPayloadSchema,
});

export type RejectUserMessage = z.infer<typeof RejectUserMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion("type", [
  JoinRoomMessageSchema,
  RequestSongMessageSchema,
  UpvoteSongMessageSchema,
  ApproveSongMessageSchema,
  RejectSongMessageSchema,
  BroadcastNowPlayingMessageSchema,
  NextSongMessageSchema,
  ApproveUserMessageSchema,
  RejectUserMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// --- Server -> Client Messages (Incoming to client) ---

export const QueueUpdateMessageSchema = z.object({
  type: z.literal("queue_update"),
  payload: z.object({
    queue: z.array(SongDataSchema),
  }),
});

export type QueueUpdateMessage = z.infer<typeof QueueUpdateMessageSchema>;

export const SongRequestedMessageSchema = z.object({
  type: z.literal("song_requested"),
  payload: z.object({
    song: SongDataSchema,
  }),
});

export type SongRequestedMessage = z.infer<typeof SongRequestedMessageSchema>;

export const SongApprovedMessageSchema = z.object({
  type: z.literal("song_approved"),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type SongApprovedMessage = z.infer<typeof SongApprovedMessageSchema>;

export const SongRejectedMessageSchema = z.object({
  type: z.literal("song_rejected"),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type SongRejectedMessage = z.infer<typeof SongRejectedMessageSchema>;

export const ErrorMessageSchema = z.object({
  type: z.literal("error"),
  payload: z.object({
    message: z.string().min(1),
  }),
});

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

export const AdminNotJoinedMessageSchema = z.object({
  type: z.literal("admin_not_joined"),
  payload: z.object({}),
});

export type AdminNotJoinedMessage = z.infer<typeof AdminNotJoinedMessageSchema>;

export const AdminJoinedMessageSchema = z.object({
  type: z.literal("admin_joined"),
  payload: z.object({}),
});

export type AdminJoinedMessage = z.infer<typeof AdminJoinedMessageSchema>;

export const JoinedRoomMessageSchema = z.object({
  type: z.literal("joined_room"),
  payload: z.object({
    roomId: z.string().min(1),
    config: RoomConfigSchema,
    queue: z.array(SongDataSchema),
  }),
});

export type JoinedRoomMessage = z.infer<typeof JoinedRoomMessageSchema>;

export const ListUsersMessageSchema = z.object({
  type: z.literal("list_users"),
  payload: z.object({
    users: z.array(JWTPayloadSchema),
  }),
});

export type ListUsersMessage = z.infer<typeof ListUsersMessageSchema>;

export const JoinRequestedMessageSchema = z.object({
  type: z.literal("join_requested"),
  payload: UserShortPayloadSchema,
});

export type JoinRequestedMessage = z.infer<typeof JoinRequestedMessageSchema>;

export const RequestAlreadySentMessageSchema = z.object({
  type: z.literal("request_already_sent"),
  payload: z.object({}),
});

export type RequestAlreadySentMessage = z.infer<
  typeof RequestAlreadySentMessageSchema
>;

export const UserApprovedMessageSchema = z.object({
  type: z.literal("user_approved"),
  payload: UserShortPayloadSchema,
});

export type UserApprovedMessage = z.infer<typeof UserApprovedMessageSchema>;

export const UserRejectedMessageSchema = z.object({
  type: z.literal("user_rejected"),
  payload: UserShortPayloadSchema,
});

export type UserRejectedMessage = z.infer<typeof UserRejectedMessageSchema>;

export const UsersRequestedListMessageSchema = z.object({
  type: z.literal("users_requested_list"),
  payload: z.object({
    users: z.array(UserShortPayloadSchema),
  }),
});

export type UsersRequestedListMessage = z.infer<
  typeof UsersRequestedListMessageSchema
>;

export const NowPlayingUpdateMessageSchema = z.object({
  type: z.literal("now_playing_update"),
  payload: z.object({
    song: SongDataSchema.nullable(),
  }),
});

export type NowPlayingUpdateMessage = z.infer<
  typeof NowPlayingUpdateMessageSchema
>;

export const ServerMessageSchema = z.discriminatedUnion("type", [
  QueueUpdateMessageSchema,
  SongRequestedMessageSchema,
  SongApprovedMessageSchema,
  SongRejectedMessageSchema,
  ErrorMessageSchema,
  AdminNotJoinedMessageSchema,
  AdminJoinedMessageSchema,
  JoinedRoomMessageSchema,
  ListUsersMessageSchema,
  JoinRequestedMessageSchema,
  RequestAlreadySentMessageSchema,
  UserApprovedMessageSchema,
  UserRejectedMessageSchema,
  UsersRequestedListMessageSchema,
  NowPlayingUpdateMessageSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// --- WebSocket Hook Types ---

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type JoinState = "idle" | "joining" | "joined" | "blocked";

export type UseWebSocketReturn = {
  connectionState: ConnectionState;
  joinState: JoinState;
  joinError: string | null;
  isConnected: boolean;
  error: string | null;
  roomConfig: RoomConfig | null;
  queue: SongData[];
  pendingRequests: SongData[];
  joinRoom: (roomId: string, user: JWTPayload) => void;
  requestSong: (song: SongPayload) => void;
  upvoteSong: (songId: string, userId: string) => void;
  approveSong: (songId: string) => void;
  rejectSong: (songId: string) => void;
  approveUser: (userId: string, username: string) => void;
  rejectUser: (userId: string, username: string) => void;
  sendMessage: (message: ClientMessage) => void;
};
