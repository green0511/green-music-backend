import { Schema} from 'mongoose'
import { IUser } from './User.interface'
import * as bcrypt from 'bcryptjs'

import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

export const UserSchema = new Schema({
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
    virtuals: true,
    transform: function (doc, ret, game) {
      delete ret.__v
      delete ret._id
      delete ret.password
      return ret
    }
  }, 
  toJSON: {
    virtuals: true
  }
})

UserSchema.pre('save', function (next) {
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