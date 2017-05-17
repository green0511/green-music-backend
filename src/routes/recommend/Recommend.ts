import { IRecommend } from './Recommend.interface'
import { RecommendSchema } from './Recommend.schema'
import { RecommendModel } from './Recommend.model'
import { IUser } from '../user'
import { IList } from '../list'
import { Schema } from 'mongoose'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

export class Recommend {

  constructor(public document: IRecommend) {  }
  
  static create(list: IList) {
    let recommend = {
      list: <any>list._id
    }
    serverDebugger('add recommend :', recommend)
    return new Promise<IRecommend>((resolve, reject) => {
      new RecommendModel(recommend)
      .save()
      .then(saveRecommend => {
        resolve(saveRecommend)
      })
      .catch(err => {
        serverDebugger(err)
        resolve(null)
      })
    })
  }
  
  static getCount(query) {
    serverDebugger('get recommend count by query: ', query)
    return new Promise<number> ((resolve, reject) => {
      RecommendModel.count(query)
        .then(count => {
          serverDebugger('get recommend count: ', count)
          resolve(count)
        })
        .catch(err => {
          serverDebugger('get recommend count error: ', err)
          resolve(0)
        })
    })
  }

  static getAll(page: number = 1, length: number = 10) {
    serverDebugger('get all recommend ')
    return new Promise<IRecommend[]>((resolve, reject) => {
      RecommendModel.find({})
        .populate({
          path: 'list',
          populate: { path: 'user', select: 'username avatar id' }
        })
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
    return new Promise<IRecommend> ((resolve, reject) => {
      RecommendModel.findById(listId)
      .populate({
        path: 'list',
        populate: { path: 'user', select: 'username avatar id' }
      })
      .exec()
      .then(foundRecommend => {
        serverDebugger('found recommend:', foundRecommend)
        resolve(foundRecommend)
      })
      .catch(error => {
        serverDebugger('find list error:', error)
        resolve(null)
      })
    })
  }

  static delete(listId: Schema.Types.ObjectId) {
    serverDebugger('deleting list :', listId)
    return new Promise<IRecommend> ((resolve, reject) => {
        RecommendModel.findOneAndRemove({
          _id: listId
        })
        .exec()
        .then(deletedRecommend => {
          serverDebugger('delete recommend success:', deletedRecommend)
          resolve(deletedRecommend)
        })
        .catch(err => {
          serverDebugger('delete list error:', err)
          resolve(null)
        })
    })
  }
}