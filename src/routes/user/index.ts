import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

let serverDebugger = debug('ts-express:server')
import { User } from './user.model'

import { auth } from '../../auth'

class UserRouter {
  router: Router

  constructor() {
    this.router = Router()
    this.router.get('/', this.getAll)
    this.router.post('/', this.add)
    this.router.post('/exist', this.checkUsername)
    this.router.post('/login', this.login)
  }
  
  public async add(req: Request, res: Response, next: NextFunction) {
    const { username, password, confirm } = req.body
    if (!username || !password || !confirm) {
      res.json({err: '信息不完整'})
      return
    }
    if (password !== confirm) {
      return res.json({err: '两次输入密码不一致'})
    }
    
    let findUser = await User.find({username})
    if (findUser) {
      return res.json({err: '用户名已被占用'})
    }
    let regUser = await User.create(req.body)
    
    let token = auth.generateToken({id: regUser.id})
    return res.json({token, success: true})

  }
  public getAll(req: Request, res: Response, next: NextFunction) {

  }

  public checkUsername(req: Request, res: Response, next: NextFunction) {
    const { username } = req.body
    User.find({ username })
      .then(user => {
        return res.json({exist: !!user})
      })
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    let { username, password } = req.body

    let findUser = await User.find({username})
    if (!findUser) {
      return res.json({err: '用户不存在'})
    }

    let checkedUser = await User.checkPassword({username, password})

    if (checkedUser) {
        let token = auth.generateToken({id: checkedUser.id})
        return res.json({token})
    }

    return res.json({err: '用户名或密码错误'})
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