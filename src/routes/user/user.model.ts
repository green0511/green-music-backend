import * as mongoose from 'mongoose'
import { Schema, model, Document } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import * as debug from 'debug'
import * as passport from 'passport'

let serverDebugger = debug('ts-express:server')

export interface IUser extends Document {
  id?: string
  username: any
  password: any
  created?: Date
  updated?: Date
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

// export let User = model('User', UserSchema)
export let UserSchema = model<IUser>('User', schema)

export class User {
  
  constructor(public document: IUser) {  }

  get username(): string {
    return this.document && this.document.username
  }

  get password(): string {
    return this.document && this.document.password
  }

  get id(): string {
    return this.document && this.document._id
  }

  static create(user: IUser) {
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

}