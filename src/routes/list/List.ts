import { IList, IMusic } from './List.interface'
import { ListSchema } from './List.schema'
import { ListModel } from './List.model'
import { IUser } from '../user'
import { Schema } from 'mongoose'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

const PLATFORMS: String[] = ['qq']

export class List {

  constructor(public document: IList) {  }
  
  static create(list: IList, user: IUser) {
    serverDebugger('creating list :', list)
    list.user = user._id
    return new Promise<IList>((resolve, reject) => {
      new ListModel(list)
      .save()
      .then(savedList => {
        resolve(savedList)
      })
      .catch(err => {
        serverDebugger(err)
        resolve(null)
      })
    })
  }
  
  static getCount(query) {
    serverDebugger('get list count by query: ', query)
    return new Promise<number> ((resolve, reject) => {
      ListModel.count(query)
        .then(count => {
          serverDebugger('get list count: ', count)
          resolve(count)
        })
        .catch(err => {
          serverDebugger('get list count error: ', err)
          resolve(0)
        })
    })
  }

  static find(query: any, page: number = 1, length: number = 10, sort: 'new' | 'hot' = 'new') {
    let sortMap = {
      'new': {
        key: 'created',
        direction: -1
      },
      'hot': {
        key: 'view',
        direction: -1
      }
    }
    let sortOption = {}
    sortOption[sortMap[sort].key] = sortMap[sort].direction
    serverDebugger('finding list by query: ', query)
    serverDebugger('sort list by sortOption: ', sortOption)
    return new Promise<IList[]>((resolve, reject) => {
      ListModel.find(query)
        .sort(sortOption)
        .populate('user')
        .skip((page - 1) * length)
        .limit(length)
        .exec()
        .then(finded => resolve(finded))
        .catch(err => {
          serverDebugger('error occurs: ', err)
          reject(null)
        })
    })
  }

  static findById(listId: Schema.Types.ObjectId) {
    serverDebugger('find list by id:', listId)
    return new Promise<IList> ((resolve, reject) => {
      ListModel.findById(listId)
      .populate({
        path: 'user',
        select: 'username avatar'
      })
      .exec()
      .then(listFound => {
        serverDebugger('found list:', listFound)
        resolve(listFound)
      })
      .catch(error => {
        serverDebugger('find list error:', error)
        resolve(null)
      })
    })
  }

  static findByName(listName: string, user: IUser) {
    serverDebugger('finding list by name:', listName)
    serverDebugger('with user:', user)
    return new Promise<IList> ((resolve, reject) => {
      ListModel.findOne({
        name: listName,
        user: user.id
      })
      .populate('user')
      .exec()
      .then(res => resolve(res))
      .catch(err => {
        serverDebugger('error occurs:', err)
        resolve(null)
      })
      
    })
  }

  static delete(listId: Schema.Types.ObjectId) {
    serverDebugger('deleting list :', listId)
    return new Promise<IList> ((resolve, reject) => {
        ListModel.findOneAndRemove({
          _id: listId
        })
        .exec()
        .then(deletedList => {
          serverDebugger('delete list success:', deletedList)
          resolve(deletedList)
        })
        .catch(err => {
          serverDebugger('delete list error:', err)
          resolve(null)
        })
    })
  }
  
  static update(listId: Schema.Types.ObjectId, data: IList) {
    let obj = {}
    data.name !== undefined && (obj['name'] = data.name)
    data.desc !== undefined && (obj['desc'] = data.desc)
    return new Promise<IList> ( (resolve, reject) => {
      ListModel.findOneAndUpdate({_id: listId}, obj)
      .exec()
      .then(update => {
        serverDebugger('update:', update)
        resolve(update)
      })
      .catch(err => {
        serverDebugger('update list err: ', err)
        resolve(null)
      })
    })
  }

  static addView(listId: Schema.Types.ObjectId) {
    return new Promise<boolean>((resolve, reject) => {
      ListModel.findByIdAndUpdate({
        _id: listId
      }, {
        $inc: {
          view: 1
        }
      })
      .exec()
      .then(update => {
        serverDebugger('add view success for ', listId)
        resolve(true)
      })
      .catch(err => {
        serverDebugger('add view error,', err)
        resolve(false)
      })
    })
  }

  static addPlay(listId: Schema.Types.ObjectId) {
    return new Promise<boolean>((resolve, reject) => {
      ListModel.findByIdAndUpdate({
        _id: listId
      }, {
        $inc: {
          play: 1
        }
      })
      .exec()
      .then(update => {
        serverDebugger('add play success for ', listId)
        resolve(true)
      })
      .catch(err => {
        serverDebugger('add play error,', err)
        resolve(false)
      })
    })
  }

  static addSong(listId: Schema.Types.ObjectId, song: IMusic) {
    return new Promise<boolean> ((resolve, reject) => {
      ListModel.findOneAndUpdate({_id: listId}, {
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
      ListModel.findByIdAndUpdate(listId, {
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