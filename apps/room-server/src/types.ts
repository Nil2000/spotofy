import type { SongStatus } from "@repo/db";
import { WebSocket } from "ws";

import { z } from "zod";
import {
  CLIENT_TO_SERVER_MESSAGE_TYPES,
  SERVER_TO_CLIENT_MESSAGE_TYPES,
} from "./constants";

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

export type Song = z.infer<typeof SongSchema> & {
  songRequestTimeout: NodeJS.Timeout;
};

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

export type ClientConnection = {
  ws: WebSocket;
  user: JWTPayload | null;
  roomId: string;
};

// --- WS Message Types ---

export const JoinRoomMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.JOIN_ROOM),
  payload: z.object({
    roomId: z.string().min(1),
    user: JWTPayloadSchema,
  }),
});

export type JoinRoomMessage = z.infer<typeof JoinRoomMessageSchema>;

export const RequestSongMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.REQUEST_SONG),
  payload: z.object({
    song: SongPayloadSchema,
  }),
});

export type RequestSongMessage = z.infer<typeof RequestSongMessageSchema>;

export const UpvoteSongMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.UPVOTE_SONG),
  payload: z.object({
    songId: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export type UpvoteSongMessage = z.infer<typeof UpvoteSongMessageSchema>;

export const ApproveSongMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_SONG),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type ApproveSongMessage = z.infer<typeof ApproveSongMessageSchema>;

export const RejectSongMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_SONG),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type RejectSongMessage = z.infer<typeof RejectSongMessageSchema>;

export const ApproveUserMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.APPROVE_USER),
  payload: UserShortPayloadSchema,
});

export type ApproveUserMessage = z.infer<typeof ApproveUserMessageSchema>;

export const RejectUserMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.REJECT_USER),
  payload: UserShortPayloadSchema,
});

export type RejectUserMessage = z.infer<typeof RejectUserMessageSchema>;

export const BroadcastNowPlayingMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.BROADCAST_NOW_PLAYING),
});

export type BroadcastNowPlayingMessage = z.infer<
  typeof BroadcastNowPlayingMessageSchema
>;

export const NextSongMessageSchema = z.object({
  type: z.literal(CLIENT_TO_SERVER_MESSAGE_TYPES.NEXT_SONG),
});

export type NextSongMessage = z.infer<typeof NextSongMessageSchema>;

export const IncomingMessageSchema = z.discriminatedUnion("type", [
  JoinRoomMessageSchema,
  RequestSongMessageSchema,
  UpvoteSongMessageSchema,
  ApproveSongMessageSchema,
  RejectSongMessageSchema,
  ApproveUserMessageSchema,
  RejectUserMessageSchema,
  BroadcastNowPlayingMessageSchema,
  NextSongMessageSchema,
]);

export type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

// --- Server -> Client Messages ---

export const QueueUpdateMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.QUEUE_UPDATE),
  payload: z.object({
    queue: z.array(SongDataSchema),
  }),
});

export type QueueUpdateMessage = z.infer<typeof QueueUpdateMessageSchema>;

export const SongRequestedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REQUESTED),
  payload: z.object({
    song: SongDataSchema,
  }),
});

export type SongRequestedMessage = z.infer<typeof SongRequestedMessageSchema>;

export const SongApprovedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_APPROVED),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type SongApprovedMessage = z.infer<typeof SongApprovedMessageSchema>;

export const SongRejectedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.SONG_REJECTED),
  payload: z.object({
    songId: z.string().min(1),
  }),
});

export type SongRejectedMessage = z.infer<typeof SongRejectedMessageSchema>;

export const ErrorMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.ERROR),
  payload: z.object({
    message: z.string().min(1),
  }),
});

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

export const AdminNotJoinedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_NOT_JOINED),
  payload: z.object({}),
});

export type AdminNotJoinedMessage = z.infer<typeof AdminNotJoinedMessageSchema>;

export const JoinedRoomMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.JOINED_ROOM),
  payload: z.object({
    roomId: z.string().min(1),
    config: RoomConfigSchema,
    queue: z.array(SongDataSchema),
  }),
});

export type JoinedRoomMessage = z.infer<typeof JoinedRoomMessageSchema>;

export const ListUsersMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.LIST_USERS),
  payload: z.object({
    users: z.array(JWTPayloadSchema),
  }),
});

export type ListUsersMessage = z.infer<typeof ListUsersMessageSchema>;

export const JoinRequestedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.JOIN_REQUESTED),
  payload: UserShortPayloadSchema,
});

export type JoinRequestedMessage = z.infer<typeof JoinRequestedMessageSchema>;

export const RequestAlreadySentMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.REQUEST_ALREADY_SENT),
  payload: z.object({}),
});

export type RequestAlreadySentMessage = z.infer<
  typeof RequestAlreadySentMessageSchema
>;

export const AdminJoinedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.ADMIN_JOINED),
  payload: z.object({}),
});

export type AdminJoinedMessage = z.infer<typeof AdminJoinedMessageSchema>;

export const UserApprovedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.USER_APPROVED),
  payload: UserShortPayloadSchema,
});

export type UserApprovedMessage = z.infer<typeof UserApprovedMessageSchema>;

export const UserRejectedMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.USER_REJECTED),
});

export type UserRejectedMessage = z.infer<typeof UserRejectedMessageSchema>;

export const UsersRequestedListMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.USERS_REQUESTED_LIST),
  payload: z.object({
    users: z.array(UserShortPayloadSchema),
  }),
});

export type UsersRequestedListMessage = z.infer<
  typeof UsersRequestedListMessageSchema
>;

export const NowPlayingUpdateMessageSchema = z.object({
  type: z.literal(SERVER_TO_CLIENT_MESSAGE_TYPES.NOW_PLAYING_UPDATE),
  payload: z.object({
    song: SongDataSchema.nullable(),
  }),
});

export type NowPlayingUpdateMessage = z.infer<
  typeof NowPlayingUpdateMessageSchema
>;

export const OutgoingMessageSchema = z.discriminatedUnion("type", [
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

export type OutgoingMessage = z.infer<typeof OutgoingMessageSchema>;
