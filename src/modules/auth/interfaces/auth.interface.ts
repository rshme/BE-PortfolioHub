export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    avatarUrl?: string;
    bio?: string;
    socialLinks?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
}
