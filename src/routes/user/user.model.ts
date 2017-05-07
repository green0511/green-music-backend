import * as mongoose from 'mongoose'
import { Schema, model, Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import * as debug from 'debug'
import * as passport from 'passport'
import { IList } from '../list/list.model'

let serverDebugger = debug('ts-express:server')


type ObjectId = Schema.Types.ObjectId

export interface IUser extends Document {
  id?: ObjectId
  username: string
  password: string
  avatar: string
  active: boolean
  created?: Date
  updated?: Date
  role: 'user' | 'admin'
  lists: Array<IList>
}

let schema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    required: false
  },
  role: {
    type: String,
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

schema.pre('save', function (next) {
  serverDebugger('pre save')
  let user: IUser = this
  if (user.active == undefined) {
    user.active = true
  }
  if (!user.created) {
    user.created = new Date()
  }
  user.updated = new Date()
  if (user.isModified('password') || user.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err)
      }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err)
        }
        user.password = hash
        return next()
      })
    })
  } else {
    return next()
  }
})

export let UserSchema = model<IUser>('User', schema)

export class User {
  
  constructor(public document: IUser) {  }

  get username(): string {
    return this.document && this.document.username
  }

  get password(): string {
    return this.document && this.document.password
  }

  get id(): ObjectId {
    return this.document && this.document._id
  }

  get role() {
    return this.document && this.document.role
  }

  static create(user: IUser) {
    user.role = 'user'
    serverDebugger('creating user :', user)
    return new Promise<User>((resolve, reject) => {
      new UserSchema(user)
      .save()
      .then(savedUser => {
        resolve(new User(savedUser))
      })
      .catch(err => {
        serverDebugger(err)
        reject(err)
      })
    })
  }

  static findOrCreate(profile: passport.Profile): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      UserSchema.findOne({
        provider: profile.provider,
        id: profile.id
      })
        .exec()
        .then(user => {
          if (user) {
            return resolve(new User(user))
          }
          UserSchema.create({
            id: profile.id,
            username: profile.username
          }).then(user => resolve(new User(user)))
            
        })
    })
  }

  static getAllUsersCount() {
    return new Promise<number> ((resolve, reject) => {
      UserSchema.count({})
        .exec()
        .then(count => {
          serverDebugger('count user:', count)
          resolve(count)
        })
        .catch(err => {
          serverDebugger('count user error: ', err)
        })
    })
  }
  
  static getAll(page: number = 1, length: number = 10): Promise<IUser[]> {
    return new Promise<IUser[]> ((resolve, reject) => {
      UserSchema.find({})
        .skip((page - 1) * length)
        .limit(length)
        .then(users => {
          serverDebugger('find users:', users)
          resolve(users)
        })
        .catch(err => {
          serverDebugger('find all user err: ', err)
          resolve([])
        })
    })
  }

  static findById(id: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      UserSchema.findById(id)
        .exec()
        .then(user => resolve(new User(user)))
        .catch(err => reject(err))
    })
  }

  static find(obj: Object): Promise<User> {
    let query = {}
    Object.keys(obj).forEach(key => obj[key] && (query[key] = obj[key]))
    serverDebugger('find user by:', query)
    return new Promise<User | null>((resolve, reject) => {
      UserSchema.findOne(query)
        .exec()
        .then(user => {
          serverDebugger('found user:', !!user)
          let result = user?new User(user): null
          resolve(result)
        })
        .catch(err => reject(err))
    })
  }

  static checkPassword({username, password}): Promise<User | null> {
    return new Promise<User | null>((resolve, reject) => {
      User.find({ username: username })
        .then(foundUser => {
          if (!foundUser) { reject({err: 'user not exist'}) }
          foundUser.comparePassword(password)
            .then(isMatch => resolve(isMatch?foundUser:null))
            .catch(err => reject({err: 'user not exist'}))
        })
    })
  }

  private comparePassword(password): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      bcrypt.compare(password, this.document.password, function (err, isMatch) {
        if (err) { return reject(err) }
        resolve(isMatch)
      })
    }) 
  }

  static setUserState(userId, state: boolean) {
    return new Promise<boolean>((resolve, reject) => {
      UserSchema.findByIdAndUpdate(userId, {
        active: state
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
      UserSchema.findByIdAndUpdate(userId, {
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
      UserSchema.findByIdAndRemove(userId)
        .exec()
        .then(_ => resolve(true))
        .catch(err => {
          serverDebugger('remove user fail: ', err)
          resolve(false)
        })
    })
  }

}