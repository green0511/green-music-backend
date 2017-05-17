import { Schema } from 'mongoose'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { IList } from './List.interface'
let PrivateListSchema = new Schema({
  name: { type: String, required: true },
  desc: { type: String, required: false },
  cover: { type: String, required: true },
  musics: { type: Array, required: false },
  created: { type: Date, required: false, index: true },
  updated: { type: Date, required: false },
  view: { type: Number, required: false, index: true },
  play: { type: Number, required: false, index: true },
  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
}, {
  toObject: { virtuals: true }, 
  toJSON: { virtuals: true },
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})

PrivateListSchema.pre('save', function (next) {
  serverDebugger('pre ListSchema save')
  let list: IList = this
  if (!list.created) {
    list.created = new Date()
  }
  if (!list.musics) {
    list.musics = []
  }
  if (!list.view) {
    list.view = 0
  }
  if (!list.play) {
    list.play = 0
  }
  list.updated = new Date()
  next()
}).pre('set', function(next) {
  serverDebugger('has been initialized from the db')
  next()
})

export let ListSchema = PrivateListSchema