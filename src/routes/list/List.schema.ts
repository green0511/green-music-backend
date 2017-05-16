import { Schema } from 'mongoose'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { IList } from './List.interface'
export let ListSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: false },
  cover: { type: String, required: true },
  musics: { type: Array, required: false },
  created: { type: Date, required: false },
  updated: { type: Date, required: false },
  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, {
  toObject: { virtuals: true }, 
  toJSON: { virtuals: true }
})

ListSchema.pre('save', function (next) {
  serverDebugger('pre listSchema save')
  let list: IList = this
  if (!list.created) {
    list.created = new Date()
  }
  list.updated = new Date()
  next()
})