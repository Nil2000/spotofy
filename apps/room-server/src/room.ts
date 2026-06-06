import { prisma } from "@repo/db";
import type {
  RoomConfig,
  SongPayload,
  SongData,
  UserPayload,
  UserShortPayload,
} from "./types";
import { createId } from "@paralleldrive/cuid2";
import type { WebSocket } from "ws";

type UpvoteResult =
  | "success"
  | "already_upvoted"
  | "song_not_found"
  | "upvote_limit_reached";

export type RequestSongResult = SongData | "duplicate";
export type RejectedSongResult = {
  id: string;
  name: string;
  artist: string;
  requestedByUserId: string | null;
} | null;

type UserPayloadWithWs = UserPayload & {
  ws: WebSocket;
};

export class Room {
  private config: RoomConfig;
  private users: Map<string, UserPayload> = new Map();
  private adminJoined: boolean = false;
  private usersRequested: Map<string, UserPayloadWithWs> = new Map();

  constructor(config: RoomConfig) {
    this.config = config;
  }

  addUser(user: UserPayload): void {
    this.users.set(user.userId, user);
  }

  removeUser(userId: string): void {
    this.users.delete(userId);
  }

  getUsers(): UserPayload[] {
    return Array.from(this.users.values());
  }

  getMemberCount(): number {
    return this.users.size;
  }

  hasUser(userId: string): boolean {
    return this.users.has(userId);
  }

  isAtUserCapacity(userId: string): boolean {
    if (this.hasUser(userId) || userId === this.config.admin) {
      return false;
    }
    return this.getMemberCount() >= this.config.maxUsers;
  }

  async getUserUpvoteCount(userId: string): Promise<number> {
    return prisma.songUpvoteHistory.count({
      where: { roomId: this.config.id, userId },
    });
  }

  getConfig(): RoomConfig {
    return this.config;
  }

  isAutoApproveSongs(): boolean {
    return this.config.autoApproveSongs;
  }

  isAutoApproveUsers(): boolean {
    return this.config.autoApproveUsers;
  }

  getAdminId(): string {
    return this.config.admin;
  }

  setAdminStatus(status: boolean): void {
    this.adminJoined = status;
  }

  isAdminJoined(): boolean {
    return this.adminJoined;
  }

  addUserRequest(user: UserPayload, ws: WebSocket) {
    this.usersRequested.set(user.userId, {
      userId: user.userId,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      ws,
    });
  }

  checkUserRequestedAlready(userId: string) {
    return this.usersRequested.has(userId);
  }

  removeUserRequest(userId: string) {
    this.usersRequested.delete(userId);
  }

  getUsersRequestedList(): UserShortPayload[] {
    return Array.from(this.usersRequested.values()).map((user) => ({
      userId: user.userId,
      username: user.username,
    }));
  }

  getUserRequested(userId: string): UserPayloadWithWs | undefined {
    return this.usersRequested.get(userId);
  }

  getPendingUserRequests(): UserPayloadWithWs[] {
    return Array.from(this.usersRequested.values());
  }

  clearUsersRequested(): void {
    this.usersRequested.clear();
  }

  async getSong(songId: string): Promise<SongData | null> {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return null;
    }
    return song;
  }

  static async find(roomId: string): Promise<Room | null> {
    const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });

    if (!dbRoom) {
      return null;
    }

    return new Room({
      id: dbRoom.id,
      name: dbRoom.name,
      admin: dbRoom.adminId,
      maxUpvotes: dbRoom.maxUpvotes,
      maxUsers: dbRoom.maxUsers,
      autoApproveSongs: dbRoom.autoApproveSongs,
      autoApproveUsers: dbRoom.autoApproveUsers,
    });
  }

  async requestSong(
    songPayload: SongPayload,
    requestedByUserId: string,
  ): Promise<RequestSongResult> {
    const existing = await prisma.song.findFirst({
      where: {
        roomId: this.config.id,
        songId: songPayload.songId,
        status: { in: ["REQUESTED", "QUEUED", "PLAYING"] },
      },
    });

    if (existing) {
      return "duplicate";
    }

    const song = await prisma.song.create({
      data: {
        songId: songPayload.songId,
        name: songPayload.name,
        artist: songPayload.artist,
        url: songPayload.url,
        imgUrl: songPayload.imgUrl,
        requestedByUserId,
        roomId: this.config.id,
        status: this.config.autoApproveSongs ? "QUEUED" : "REQUESTED",
      },
    });

    // if (!this.config.autoApproveSongs) {
    //   const timeout = setTimeout(async () => {
    //     songRequestTimeouts.delete(song.id);
    //     await prisma.song
    //       .update({
    //         where: { id: song.id },
    //         data: { status: "REJECTED" },
    //       })
    //       .catch(() => {});
    //   }, SONG_REQUEST_TIMEOUT);
    //   songRequestTimeouts.set(song.id, timeout);
    // }

    return {
      id: song.id,
      songId: song.songId,
      name: song.name,
      artist: song.artist,
      url: song.url,
      upvotes: song.upvotes,
      imgUrl: song.imgUrl,
      status: song.status,
    };
  }

  async upvote(songId: string, userId: string): Promise<UpvoteResult> {
    const upvotesUsed = await this.getUserUpvoteCount(userId);
    if (upvotesUsed >= this.config.maxUpvotes) {
      return "upvote_limit_reached";
    }

    const result = await prisma.$transaction(async (tx) => {
      const song = await tx.song.findFirst({
        where: { id: songId, roomId: this.config.id, status: "QUEUED" },
        select: { id: true },
      });

      if (!song) {
        return "song_not_found" satisfies UpvoteResult;
      }

      const upvotesInRoom = await tx.songUpvoteHistory.count({
        where: { roomId: this.config.id, userId },
      });
      if (upvotesInRoom >= this.config.maxUpvotes) {
        return "upvote_limit_reached" satisfies UpvoteResult;
      }

      const insertedRows = await tx.$executeRaw`
        INSERT INTO "song_upvote_history" ("id", "roomId", "songId", "userId", "createdAt")
        VALUES (${createId()}, ${this.config.id}, ${songId}, ${userId}, NOW())
        ON CONFLICT ("roomId", "songId", "userId") DO NOTHING
      `;

      if (insertedRows === 0) {
        return "already_upvoted" satisfies UpvoteResult;
      }

      await tx.song.update({
        where: { id: songId },
        data: { upvotes: { increment: 1 } },
      });

      return "success" satisfies UpvoteResult;
    });

    return result;
  }

  async getCurrentSong(): Promise<SongData | null> {
    const song = await prisma.song.findFirst({
      where: { roomId: this.config.id, status: "PLAYING" },
    });
    if (!song) return null;
    return {
      id: song.id,
      songId: song.songId,
      name: song.name,
      artist: song.artist,
      url: song.url,
      upvotes: song.upvotes,
      imgUrl: song.imgUrl,
      status: song.status,
    };
  }

  async approveSong(songId: string): Promise<boolean> {
    try {
      await prisma.song.update({
        where: { id: songId, roomId: this.config.id, status: "REQUESTED" },
        data: { status: "QUEUED" },
      });
      return true;
    } catch (error) {
      console.error("Error approving song:", error);
      return false;
    }
  }

  async rejectSong(songId: string): Promise<RejectedSongResult> {
    try {
      const song = await prisma.song.update({
        where: { id: songId, roomId: this.config.id, status: "REQUESTED" },
        data: { status: "REJECTED" },
        select: {
          id: true,
          name: true,
          artist: true,
          requestedByUserId: true,
        },
      });
      return song;
    } catch {
      return null;
    }
  }

  async loadSongs(): Promise<SongData[]> {
    const songs = await prisma.song.findMany({
      where: { roomId: this.config.id, status: "QUEUED" },
      orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
    });
    return songs.map((s) => ({
      id: s.id,
      songId: s.songId,
      name: s.name,
      artist: s.artist,
      url: s.url,
      upvotes: s.upvotes,
      imgUrl: s.imgUrl,
      status: s.status,
    }));
  }

  async loadRequestedSongs(): Promise<SongData[]> {
    const songs = await prisma.song.findMany({
      where: { roomId: this.config.id, status: "REQUESTED" },
      orderBy: { createdAt: "asc" },
    });
    return songs.map((s) => ({
      id: s.id,
      songId: s.songId,
      name: s.name,
      artist: s.artist,
      url: s.url,
      upvotes: s.upvotes,
      imgUrl: s.imgUrl,
      status: s.status,
    }));
  }

  async playCurrentSong(): Promise<SongData | null> {
    return this.getCurrentSong();
  }

  async playNextSong(): Promise<SongData | null> {
    // Delete the currently playing song (if any)
    await prisma.song.deleteMany({
      where: { roomId: this.config.id, status: "PLAYING" },
    });

    // Get the top queued song (highest upvotes, earliest created)
    const next = await prisma.song.findFirst({
      where: { roomId: this.config.id, status: "QUEUED" },
      orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
    });

    if (!next) {
      return null;
    }

    const updated = await prisma.song.update({
      where: { id: next.id },
      data: { status: "PLAYING" },
    });

    return {
      id: updated.id,
      songId: updated.songId,
      name: updated.name,
      artist: updated.artist,
      url: updated.url,
      upvotes: updated.upvotes,
      imgUrl: updated.imgUrl,
      status: updated.status,
    };
  }
}
