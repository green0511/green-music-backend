import * as mongoose from 'mongoose'
import { Schema, model, Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import * as passport from 'passport'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { IUser } from './User.interface'
import { UserModel } from './User.model'

type ObjectId = Schema.Types.ObjectId

export class User {
  
  constructor(public document: IUser) {  }

  static create(user: IUser): Promise<IUser> {
    user.role = 'user'
    serverDebugger('creating user :', user)
    return new Promise<IUser>((resolve, reject) => {
      new UserModel(user)
      .save()
      .then(savedUser => {
        resolve(savedUser)
      })
      .catch(err => {
        serverDebugger(err)
        resolve(null)
      })
    })
  }

  static getAllUsersCount(): Promise<number> {
    return new Promise<number> ((resolve, reject) => {
      UserModel.count({})
        .exec()
        .then(count => {
          serverDebugger('count user:', count)
          resolve(count)
        })
        .catch(err => {
          serverDebugger('count user error: ', err)
          resolve(0)
        })
    })
  }
  
  static getAll(page: number = 1, length: number = 10): Promise<IUser[]> {
    return new Promise<IUser[]> ((resolve, reject) => {
      UserModel.find({})
        .skip((page - 1) * length)
        .limit(length)
        .then(users => {
          serverDebugger('find users:', users)
          resolve(users)
        })
        .catch(err => {
          serverDebugger('find all user err: ', err)
          resolve(null)
        })
    })
  }

  static findById(id: string): Promise<IUser> {
    return new Promise<IUser>((resolve, reject) => {
      UserModel.findById(id)
        .exec()
        .then(user => resolve(user))
        .catch(err => {
          serverDebugger('find user by id err: ', err)
          resolve(null)
        })
    })
  }

  static find(obj: Object): Promise<IUser> {
    let query = {}
    Object.keys(obj).forEach(key => obj[key] && (query[key] = obj[key]))
    serverDebugger('find user by:', query)
    return new Promise<IUser | null>((resolve, reject) => {
      UserModel.findOne(query)
        .exec()
        .then(user => {
          serverDebugger('found user:', user)
          resolve(user)
        })
        .catch(err => {
          serverDebugger('find user error:', err)
          resolve(null)
        })
    })
  }

  static checkPassword(originPassword, encryptPassword): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      bcrypt.compare(originPassword, encryptPassword, function (err, isMatch) {
        if (err) { return reject(err) }
        resolve(isMatch)
      })
    }) 
  }

  static setUserState(userId, active: boolean) {
    return new Promise<boolean>((resolve, reject) => {
      UserModel.findByIdAndUpdate(userId, {
        active
      })
      .exec()
      .then(user => resolve(true))
      .catch(err => {
        serverDebugger('err: ', err)
        resolve(false)
      })
    })
  }

  static setUserAdmin(userId, isAdmin: boolean) {
    return new Promise<boolean>((resolve, reject) => {
      UserModel.findByIdAndUpdate(userId, {
        role: isAdmin?'admin':'user'
      })
      .exec()
      .then(user => resolve(true))
      .catch(err => {
        serverDebugger('err: ', err)
        resolve(false)
      })
    })
  }

  static remove(userId) {
    return new Promise<boolean>((resolve, reject) => {
      UserModel.findByIdAndRemove(userId)
        .exec()
        .then(_ => resolve(true))
        .catch(err => {
          serverDebugger('remove user fail: ', err)
          resolve(false)
        })
    })
  }

}