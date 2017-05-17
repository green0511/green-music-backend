import { Schema } from 'mongoose'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { IRecommend } from './Recommend.interface'
export let RecommendSchema = new Schema({
  list: { type: Schema.Types.ObjectId, required: true, ref: 'List' },
  created: { type: Date, required: false },
  updated: { type: Date, required: false }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
})