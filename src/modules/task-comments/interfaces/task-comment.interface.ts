export interface TaskCommentWithReplies {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies: TaskCommentWithReplies[];
}
