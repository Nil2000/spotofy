import { prisma } from "@repo/db";
import { SONG_REQUEST_TIMEOUT } from "./constants";
import type { RoomConfig, SongPayload, SongData, JWTPayload } from "./types";
import { createId } from "@paralleldrive/cuid2";

const songRequestTimeouts = new Map<string, NodeJS.Timeout>();

type UpvoteResult = "success" | "already_upvoted" | "song_not_found";

export class Room {
  private config: RoomConfig;
  private users: Map<string, JWTPayload> = new Map();
  private adminJoined: boolean = false;

  constructor(config: RoomConfig) {
    this.config = config;
  }

  addUser(user: JWTPayload): void {
    this.users.set(user.userId, user);
  }

  removeUser(userId: string): void {
    this.users.delete(userId);
  }

  getUsers(): JWTPayload[] {
    return Array.from(this.users.values());
  }

  getConfig(): RoomConfig {
    return this.config;
  }

  isAutoApprove(): boolean {
    return this.config.autoApprove;
  }

  getAdminId(): string {
    return this.config.admin;
  }

  setAdminJoined(): void {
    this.adminJoined = true;
  }

  isAdminJoined(): boolean {
    return this.adminJoined;
  }

  async getSong(songId: string): Promise<SongData | null> {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      return null;
    }
    return song;
  }

  static async findOrCreate(roomId: string, adminId: string): Promise<Room> {
    let dbRoom = await prisma.room.findUnique({ where: { id: roomId } });

    if (!dbRoom) {
      dbRoom = await prisma.room.create({
        data: {
          id: roomId,
          name: roomId,
          adminId,
          maxUpvotes: 10,
          maxUsers: 10,
          autoApprove: false,
        },
      });
    }

    return new Room({
      id: dbRoom.id,
      name: dbRoom.name,
      admin: dbRoom.adminId,
      maxUpvotes: dbRoom.maxUpvotes,
      maxUsers: dbRoom.maxUsers,
      autoApprove: dbRoom.autoApprove,
    });
  }

  async requestSong(songPayload: SongPayload): Promise<SongData> {
    const song = await prisma.song.create({
      data: {
        name: songPayload.name,
        artist: songPayload.artist,
        url: songPayload.url,
        imgUrl: songPayload.imgUrl,
        roomId: this.config.id,
        status: this.config.autoApprove ? "QUEUED" : "REQUESTED",
      },
    });

    if (!this.config.autoApprove) {
      const timeout = setTimeout(async () => {
        songRequestTimeouts.delete(song.id);
        await prisma.song
          .update({
            where: { id: song.id },
            data: { status: "REJECTED" },
          })
          .catch(() => {});
      }, SONG_REQUEST_TIMEOUT);
      songRequestTimeouts.set(song.id, timeout);
    }

    return {
      id: song.id,
      name: song.name,
      artist: song.artist,
      url: song.url,
      upvotes: song.upvotes,
      imgUrl: song.imgUrl,
      status: song.status,
    };
  }

  async upvote(songId: string, userId: string): Promise<UpvoteResult> {
    const result = await prisma.$transaction(async (tx) => {
      const song = await tx.song.findFirst({
        where: { id: songId, roomId: this.config.id, status: "QUEUED" },
        select: { id: true },
      });

      if (!song) {
        return "song_not_found" satisfies UpvoteResult;
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

  async approveSong(songId: string): Promise<boolean> {
    try {
      await prisma.song.update({
        where: { id: songId, roomId: this.config.id, status: "REQUESTED" },
        data: { status: "QUEUED" },
      });
      const timeout = songRequestTimeouts.get(songId);
      if (timeout) {
        clearTimeout(timeout);
        songRequestTimeouts.delete(songId);
      }
      return true;
    } catch {
      return false;
    }
  }

  async rejectSong(songId: string): Promise<boolean> {
    try {
      await prisma.song.update({
        where: { id: songId, roomId: this.config.id, status: "REQUESTED" },
        data: { status: "REJECTED" },
      });
      const timeout = songRequestTimeouts.get(songId);
      if (timeout) {
        clearTimeout(timeout);
        songRequestTimeouts.delete(songId);
      }
      return true;
    } catch {
      return false;
    }
  }

  async loadSongs(): Promise<SongData[]> {
    const songs = await prisma.song.findMany({
      where: { roomId: this.config.id, status: "QUEUED" },
      orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
    });
    return songs.map((s) => ({
      id: s.id,
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
      name: s.name,
      artist: s.artist,
      url: s.url,
      upvotes: s.upvotes,
      imgUrl: s.imgUrl,
      status: s.status,
    }));
  }

  async playCurrentSong(): Promise<SongData | null> {
    const song = await prisma.song.findFirst({
      where: { roomId: this.config.id, status: "PLAYING" },
    });
    if (song) {
      return {
        id: song.id,
        name: song.name,
        artist: song.artist,
        url: song.url,
        upvotes: song.upvotes,
        imgUrl: song.imgUrl,
        status: song.status,
      };
    }
    return await this.playNextSong();
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
      name: updated.name,
      artist: updated.artist,
      url: updated.url,
      upvotes: updated.upvotes,
      imgUrl: updated.imgUrl,
      status: updated.status,
    };
  }
}
