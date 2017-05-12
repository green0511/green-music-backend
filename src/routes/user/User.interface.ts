import { Schema, Document } from 'mongoose'

type ObjectId = Schema.Types.ObjectId

export interface IUser extends Document {
  id?: ObjectId
  username: string
  password: string
  avatar: string
  active: boolean
  created?: Date
  updated?: Date
  role: 'user' | 'admin'
}