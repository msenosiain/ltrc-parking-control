// User types
export interface User {
  _id?: string;
  googleId: string;
  email: string;
  name: string;
  lastName: string;
  roles: UserRole[];
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  lastName: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

