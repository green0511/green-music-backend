import * as http from 'http'
import {Router, Request, Response, NextFunction} from 'express'
import axios from 'axios'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

let serverDebugger = debug('ts-express:server')
import { User } from './user.model'

import { authenticate } from '../../auth'

class UserRouter {
  router: Router

  constructor() {
    this.router = Router()
    this.router.get('/', this.getAll)
    this.router.post('/', this.add)
    this.router.post('/exist', authenticate, this.checkUsername)
    this.router.post('/login', this.login)
  }
  
  public add(req: Request, res: Response, next: NextFunction) {
    const { username, password, confirm } = req.body
    if (!username || !password || !confirm) {
      res.json({err: 'required'})
      return
    }
    if (password !== confirm) {
      return res.json({err: 'please confirm your password'})
    }

   return User.create(req.body)
     .then(user => {
       return res.json({user})
     })
     .catch(err => {
       return res.json({err})
     })
  }
  public getAll(req: Request, res: Response, next: NextFunction) {

  }

  public checkUsername(req: Request, res: Response, next: NextFunction) {
    const { username, id } = req.body
    User.find({ username, id })
      .then(user => {
        return res.json({ exist: !!user})
      })
  }

  public login(req: Request, res: Response, next: NextFunction) {
    let { username, password } = req.body
    User.checkPassword({username, password}).then(user => {
      if (user) {
        let token = jwt.sign({ id: user.id }, 'kaimansb0307')
        return res.json({token})
      }
      res.json({success: false})
    })
  }
  // public getAll(req: Request, res: Response, next: NextFunction) {
  //   ghost.getPosts().then( posts => {
  //     res.json(posts.data)
  //   }).catch(err => console.log(err)) 
  // }

  // public getPostById(req: Request, res: Response, next: NextFunction) {
  //   ghost.getPostById(req.params.id).then(posts => {
  //     res.json(posts.data)
  //   }).catch(console.log.bind(console))
  // }
}

const userRoutes = new UserRouter()

export const userRouter =  userRoutes.router