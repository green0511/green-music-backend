import { User } from '../routes/user/user.model'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt'

import { JWT_SIGN_KEY } from './secretKey'

import * as passport from 'passport'

let options: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: JWT_SIGN_KEY
} 
let strategy = new Strategy(options, (payload, next) => {
  serverDebugger('jwt payload', payload)
  User.findById(payload.id)
    .then(user => {
      serverDebugger('found user:', user)
      if (user.document) {
        next(null, user.document)
      } else {
        next(null)
      }
    })
    .catch(err => next(err))
})

passport.use(strategy)

export const JwtMiddleware = passport.initialize()

export const authenticate = passport.authenticate('jwt', { session: false })