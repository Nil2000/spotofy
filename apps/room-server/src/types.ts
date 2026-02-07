export type Song = {
  id: string;
  name: string;
  artist: string;
  url: string;
  upvotes: number;
  imgUrl: string;
  songRequestTimeout: NodeJS.Timeout;
};

export type RoomConfig = {
  id: string;
  name: string;
  admin: string;
  maxUpvotes: number;
  maxUsers: number;
  autoApprove: boolean;
};
