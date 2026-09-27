export type Role = "USER" | "ADMIN";
export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "ACTIVE" | "MATCHED" | "CLAIMED" | "RECOVERED" | "ARCHIVED";
export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MatchStatus = "PENDING" | "CONFIRMED" | "DISMISSED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Item {
  id: string;
  reporterId: string;
  reporter: { id: string; name: string };
  type: ItemType;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  location: string;
  dateLostFound: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  claims?: Claim[];
  lostMatches?: Match[];
  foundMatches?: Match[];
}

export interface Claim {
  id: string;
  itemId: string;
  item: Item;
  claimantId: string;
  claimant: { id: string; name: string };
  message: string;
  status: ClaimStatus;
  createdAt: string;
  room?: Room;
}

export interface Match {
  id: string;
  lostItemId: string;
  lostItem: Item;
  foundItemId: string;
  foundItem: Item;
  score: number;
  status: MatchStatus;
  createdAt: string;
}

export interface Room {
  id: string;
  claimId: string;
  messages: Message[];
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: { id: string; name: string };
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  status: "UNREAD" | "READ";
  createdAt: string;
}

export interface AdminStats {
  totalReports: number;
  pendingClaims: number;
  potentialMatches: number;
  unclaimedOver30: number;
  recoveredItems: number;
  lostCount: number;
  foundCount: number;
}
