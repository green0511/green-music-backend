import * as mongoose from 'mongoose'
import { Schema, model, Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import * as debug from 'debug'
import * as passport from 'passport'

import { IUser, User } from '../user/user.model'

let serverDebugger = debug('ts-express:server')

interface IMusic {
  id: string,
  platform: string,
  date: Date
}

export interface IList extends Document {
  name: string
  desc?: string
  cover: string
  userid: Schema.Types.ObjectId
  musics?: Array<IMusic>
  created?: Date
  updated?: Date
}

let listSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: false
  },
  cover: {
    type: String,
    required: true
  },
  musics: {
    type: Array,
    required: false
  },
  userid: {
    type: Schema.Types.ObjectId,
    required: true
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
  
  get musics(): Array<IMusic> {
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

  static find(state: any) {
    serverDebugger('finding list by state: ', state)
    return new Promise<IList[]>((resolve, reject) => {
      ListSchema.find(state)
        .then(finded => resolve(finded))
        .catch(err => {
          serverDebugger('error occurs: ', err)
          reject()
        })
    })
  }

  static findById(listId: Schema.Types.ObjectId) {
    serverDebugger('find list by id:', listId)
    return new Promise<IList> ((resolve, reject) => {
      ListSchema.findById(listId)
      .exec()
      .then(listFound => {
        serverDebugger('found list:', listFound)
        resolve(listFound)
      })
      .catch(error => {
        serverDebugger('find list error:', error)
        reject(error)
      })
    })
  }

  static findByName(listName: string, user: IUser) {
    serverDebugger('finding list by name:', listName)
    serverDebugger('with user:', user)
    return new Promise<IList> ((resolve, reject) => {
      ListSchema.findOne({
        name: listName,
        userid: user.id
      })
      .then(res => resolve(res))
      .catch(err => {
        serverDebugger('error occurs:', err)
        reject()
      })
      
    })
  }

  static delete(listId: Schema.Types.ObjectId) {
    serverDebugger('deleting list :', listId)
    return new Promise<void> ( (resolve, reject) => {
        ListSchema.findOneAndRemove({
          _id: listId
        })
        .exec()
        .then(deletedList => {
          serverDebugger('delete list success:', deletedList)
          return resolve()
        })
        .catch(err => {
          serverDebugger('delete list error:', err)
          return reject()
        })
    })
  }
  
  static update(listId: Schema.Types.ObjectId, data: IList) {
    let obj = {}
    data.name !== undefined && (obj['name'] = data.name)
    data.desc !== undefined && (obj['desc'] = data.desc)
    return new Promise<boolean> ( (resolve, reject) => {
      ListSchema.findOneAndUpdate({_id: listId}, obj)
      .exec()
      .then(update => {
        console.log('update:', update)
        resolve(true)
      })
      .catch(err => {
        serverDebugger('update list err: ', err)
        resolve(false)
      })
    }) 
  }

  static addSong(listId: Schema.Types.ObjectId, song: IMusic) {
    return new Promise<boolean> ((resolve, reject) => {
      ListSchema.findOneAndUpdate({_id: listId}, {
        $push: {
          musics: song
        }
      })
      .exec()
      .then(res => resolve(true))
      .catch(err => {
        serverDebugger('err: ', err)
        resolve(false)
      })
    })
  }

  static removeSong(listId: Schema.Types.ObjectId, song: IMusic) {
    let { id, platform } = song
    return new Promise<boolean> (async (resolve, reject) => {
      ListSchema.findByIdAndUpdate(listId, {
        $pull: {
          musics: { id, platform }
        }
      })
      .exec()
      .then(_ => resolve(true))
      .catch(err => {
        serverDebugger('err: ', err)
        resolve(false)
      })
    })
  }
}
