export enum Role {
  USER = "USER",
  SUPERUSER = "SUPERUSER",
}

export interface User {
  _id: string
  email: string
  password: string
  role: Role
  createdAt?: Date
  updatedAt?: Date
}

export interface UserResponse {
  _id: string
  email: string
  role: Role
  createdAt?: Date
  updatedAt?: Date
}
