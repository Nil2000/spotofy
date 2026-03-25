import { motion } from "motion/react";
import { Clock, Music, ThumbsUp } from "lucide-react";
import Image from "next/image";

import { Button } from "@repo/ui/components/ui/button";
import type { SongData } from "@/types/websocket";

type QueueSidebarProps = {
  queue: SongData[];
  userId: string;
  isConnected: boolean;
  upvoteSong: (songId: string, userId: string) => void;
};

export default function QueueSidebar({
  queue,
  userId,
  isConnected,
  upvoteSong,
}: QueueSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-xl"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Up Next</h2>
        </div>
        <span className="text-xs text-muted-foreground">{queue.length} songs</span>
      </div>

      <div className="p-3 space-y-2 max-h-80 sm:max-h-100 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No songs in queue</p>
            <p className="text-xs">Request a song to get started!</p>
          </div>
        ) : (
          queue.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="group rounded-xl border border-border/50 bg-background/50 p-3 hover:border-primary/30 hover:bg-background/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  <Image
                    src={song.imgUrl}
                    alt={song.name}
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{song.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => upvoteSong(song.id, userId)}
                      disabled={!isConnected}
                      variant="outline"
                      className="h-auto rounded-lg bg-primary/10 hover:bg-primary/20 px-2 py-1 text-xs font-medium text-primary"
                      type="button"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {song.upvotes}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.aside>
  );
}
