import { SONG_REQUEST_TIMEOUT } from "./constants";
import type { RoomConfig, Song } from "./types";

export class Room {
  private config: RoomConfig;
  private queue: Song[];
  private requestedSongs: Song[];

  constructor(id: string, name: string, admin: string) {
    this.config = {
      id,
      name,
      admin,
      maxUpvotes: 10,
      maxUsers: 10,
      autoApprove: false,
    };
    this.queue = [];
    this.requestedSongs = [];
  }

  requestSong(song: Song) {
    this.requestedSongs.push(song);
    if (this.config.autoApprove) {
      this.approveSong(song.id);
    } else {
      song.songRequestTimeout = setTimeout(() => {
        clearTimeout(song.songRequestTimeout);
        this.requestedSongs.splice(this.requestedSongs.indexOf(song), 1);
      }, SONG_REQUEST_TIMEOUT);
    }
  }

  upvote(songId: string) {
    const song = this.queue.find((song) => song.id === songId);
    if (song) {
      song.upvotes++;
    }
  }

  approveSong(songId: string) {
    const song = this.requestedSongs.find((song) => song.id === songId);
    if (song) {
      this.queue.push(song);
      this.requestedSongs.splice(this.requestedSongs.indexOf(song), 1);
    }
  }

  rejectSong(songId: string) {
    const song = this.requestedSongs.find((song) => song.id === songId);
    if (song) {
      this.requestedSongs.splice(this.requestedSongs.indexOf(song), 1);
    }
  }

  loadSongs(): Omit<Song, "songRequestTimeout">[] {
    return this.queue.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      url: song.url,
      upvotes: song.upvotes,
      imgUrl: song.imgUrl,
    }));
  }
}
