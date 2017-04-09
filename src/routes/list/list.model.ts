import * as mongoose from 'mongoose'
import { Schema, model, Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import * as debug from 'debug'
import * as passport from 'passport'

import { IUser, User } from '../user/user.model'

let serverDebugger = debug('ts-express:server')

export interface IList extends Document {
  id?: Schema.Types.ObjectId
  name: string
  userid: Schema.Types.ObjectId
  musics: Array<string>
  created?: Date
  updated?: Date
}

let listSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  musics: {
    type: Array,
    required: false
  },
  created: {
    type: Date,
    required: false
  },
  updated: {
    type: Date,
    required: false
  },
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
})

listSchema.pre('save', function (next) {
  serverDebugger('pre listSchema save')
  let list: IList = this
  if (!list.created) {
    list.created = new Date()
  }
  list.updated = new Date()
  next()
})

export let ListSchema = model<IList>('List', listSchema)

export class List {

  constructor(public document: IList) {  }

  get name() {
    return this.document && this.document.name
  }

  get id(): string {
    return this.document && this.document._id
  }
  
  get musics(): Array<string> {
    return this.document && this.document.musics
  }
  
  static create(list: IList, user: IUser) {
    serverDebugger('creating list :', list)
    list.userid = user._id
    return new Promise<List>((resolve, reject) => {
      new ListSchema(list)
      .save()
      .then(savedList => {
        resolve(new List(savedList))
      })
      .catch(err => {
        serverDebugger(err)
        reject(err)
      })
    })
  }

}
