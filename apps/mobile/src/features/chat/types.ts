export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface ChatMessageRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}
