import { Schema, Document } from 'mongoose'
import { IUser } from '../user'
export interface IMusic {
  id: string,
  platform: string,
  date: Date
}

export interface IList extends Document {
  _id: Schema.Types.ObjectId
  name: string
  desc?: string
  cover: string
  user: IUser
  musics?: Array<IMusic>
  created?: Date
  updated?: Date
}
