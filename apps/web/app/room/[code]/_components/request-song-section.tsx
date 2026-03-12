import { useState } from "react";
import { useDebounce } from "react-use";
import { motion } from "motion/react";
import { Music, Plus, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@repo/ui/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@repo/ui/components/ui/combobox";
import { toast } from "@repo/ui/components/ui/sonner";

type SearchResult = {
  id: string;
  name: string;
  artist: string;
  album: string;
  imgUrl: string;
  url: string;
  durationMs: number;
};

type RequestSongSectionProps = {
  code: string;
  isConnected: boolean;
  autoApproveSongs: boolean;
  requestSong: (song: {
    name: string;
    artist: string;
    url: string;
    imgUrl: string;
  }) => void;
};

export default function RequestSongSection({
  code,
  isConnected,
  autoApproveSongs,
  requestSong,
}: RequestSongSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SearchResult | null>(null);

  useDebounce(
    async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&roomId=${encodeURIComponent(code)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
          toast.error("Failed to search songs. Please try again.", {
            id: "room-search-error",
          });
        }
      } catch {
        setSearchResults([]);
        toast.error("Failed to search songs. Please try again.", {
          id: "room-search-request-error",
        });
      } finally {
        setSearchLoading(false);
      }
    },
    400,
    [searchQuery],
  );

  const handleSelectResult = (value: string | null) => {
    const result = searchResults.find((item) => item.id === value);
    if (!result) return;
    setSelectedSong(result);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRequestSong = () => {
    if (!selectedSong) return;
    requestSong({
      name: selectedSong.name,
      artist: selectedSong.artist,
      url: selectedSong.url,
      imgUrl: selectedSong.imgUrl,
    });
    setSelectedSong(null);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent/20 to-primary/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary/40" />
        </div>
        <div>
          <h3 className="font-semibold">Request a Song</h3>
          <p className="text-xs text-muted-foreground">Add tracks to the queue</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Combobox
          disabled={!isConnected}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          onValueChange={handleSelectResult}
        >
          <ComboboxInput
            showClear={!!searchQuery}
            placeholder="Search for a song..."
            className="w-full rounded-xl"
          />
          <ComboboxContent hidden={!searchQuery}>
            <ComboboxList>
              {searchLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  {searchResults.length === 0 && (
                    <ComboboxEmpty>No songs found.</ComboboxEmpty>
                  )}
                  {searchResults.map((result) => (
                    <ComboboxItem key={result.id} value={result.id}>
                      {result.imgUrl ? (
                        <Image
                          src={result.imgUrl}
                          alt={result.name}
                          className="w-8 h-8 rounded-md object-cover shrink-0"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Music className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.artist} · {result.album}
                        </p>
                      </div>
                    </ComboboxItem>
                  ))}
                </>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        {selectedSong && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-accent/40 bg-accent/5"
          >
            {selectedSong.imgUrl ? (
              <Image
                src={selectedSong.imgUrl}
                alt={selectedSong.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
                width={40}
                height={40}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{selectedSong.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {selectedSong.artist}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleRequestSong}
                  disabled={!isConnected}
                  className="h-auto rounded-lg bg-linear-to-r from-accent to-accent/80 px-3 py-1.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Queue
                </Button>
              </motion.div>
              <Button
                onClick={() => setSelectedSong(null)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {autoApproveSongs
          ? "Songs are automatically approved and added to the queue."
          : "Requests require admin approval before appearing in the queue."}
      </p>
    </motion.section>
  );
}
