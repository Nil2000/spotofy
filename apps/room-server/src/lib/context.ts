import type { WebSocket } from "ws";
import { Room } from "../room";
import type { ClientConnection } from "../types";

export const roomCache = new Map<string, Room>();
export const connections = new Map<WebSocket, ClientConnection>();

export function getRoom(roomId: string): Room | null {
  return roomCache.get(roomId) ?? null;
}
