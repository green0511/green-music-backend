import { Schema, Document} from 'mongoose'
import { IList } from '../list'

export interface IRecommend extends Document{
  _id: Schema.Types.ObjectId,
  list: IList,
  created: Date,
  updated: Date,
}