import { ObjectId } from 'mongodb'

export interface Model {
  _id?: ObjectId
  id?: string
  title: string
  prompt: string
  thumbnail: string
  modelUrl: string
  userName: string
  userId: string
  isPublic: boolean
  createdAt: Date
  description?: string
  tags?: string[]
  likes?: number
  views?: number
  format?: string
  fileSize?: number
} 