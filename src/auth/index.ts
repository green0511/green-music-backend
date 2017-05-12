import * as ConnectRoles from 'connect-roles'
import * as jwt from 'jsonwebtoken'
import * as passport from 'passport'
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt'

import { User } from '../routes/user'

import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

// 初始化权限中间件
export const userAuthorize = new ConnectRoles({
  failureHandler: function (req, res, action) {
    res.status(403).send({message: 'Access Denied'})
  }
})

userAuthorize.use('admin', function (req) {
  if (req.user.role === 'admin') {
    return true
  }
})

export class Auth {
    readonly JWT_SIGN_KEY: string = process.env.JWT_SIGN_KEY || 'kaimansb0307'

    JwtMiddleware

    authenticate

    authorize = userAuthorize

    AuthorizeMiddleware = userAuthorize.middleware()

    constructor() { 

        // 初始化 passport
        let options: StrategyOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeader(),
            secretOrKey: this.JWT_SIGN_KEY
        } 
        let strategy = new Strategy(options, (payload, next) => {
            serverDebugger('jwt payload', payload)
            User.findById(payload.id)
            .then(user => {
                serverDebugger('found user:', user)
                if (user) {
                next(null, user)
                } else {
                next(null)
                }
            })
            .catch(err => next(err))
        })
        
        passport.use(strategy)

        this.JwtMiddleware = passport.initialize()

        this.authenticate = passport.authenticate('jwt', { session: false })
    }
    
    generateToken(payload: any){
        return jwt.sign(payload, this.JWT_SIGN_KEY)
    }
}

export const auth = new Auth()