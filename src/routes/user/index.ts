import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

let serverDebugger = debug('ts-express:server')
import { User, IUser } from './user.model'
import { List, IList } from '../list/list.model'
import { auth } from '../../auth'

class UserRouter {
  router: Router

  constructor() {
    this.router = Router()
    this.router.get('/', auth.authenticate, auth.authorize.is('admin'), this.getAll)
    this.router.post('/', this.add)
    this.router.delete('/:userId', this.delete)
    this.router.post('/:userId/active', auth.authenticate,  auth.authorize.is('admin'), this.setUserState)
    this.router.post('/:userId/admin', auth.authenticate,  auth.authorize.is('admin'), this.setUserAdmin)
    this.router.post('/login', this.login)
    this.router.post('/exist', this.checkUsername)
    this.router.post('/current', auth.authenticate, this.getCurrentUserInfo)

    // 用户歌单
    this.router.get('/:userId/lists', this.getUserAllLists)
    this.router.post('/:userId/lists', auth.authenticate, auth.authorize.is('admin'), this.createListForUser)
  }
  
  public async add(req: Request, res: Response, next: NextFunction) {
    const { username, password, confirm, avatar } = req.body
    if (username == undefined || password == undefined || confirm == undefined || avatar == undefined) {
      res.json({success: false, msg: '信息不完整'})
      return
    }
    if (password !== confirm) {
      return res.json({success: false, msg: '两次输入密码不一致'})
    }
    
    let findUser = await User.find({username})
    if (findUser) {
      return res.json({success: false, msg: '用户名已被占用'})
    }
    let regUser = await User.create(req.body)
    
    let token = auth.generateToken({id: regUser.id})
    return res.json({token, success: true})

  }

  public async delete(req: Request, res: Response) {
    let { userId } = req.params
    let user = await User.findById(userId)
    if (!user) {
      return res.json({success: false, msg: "用户不存在"})
    }
    let result = await User.remove(userId)
    let msg = result ? '删除用户成功' : '删除用户失败'
    return res.json({success: result, msg})
  }

  public async getAll(req: Request, res: Response, next: NextFunction) {
    let user: IUser = req.user
    if (user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }

    let { page, length } = req.query
    page = parseInt(page)
    length = parseInt(length)
    let findUsers = await User.getAll(page, length)
    let allUserCount = await User.getAllUsersCount()
    res.json({success: true, msg: '', data: findUsers, count: allUserCount})
  }

  public checkUsername(req: Request, res: Response, next: NextFunction) {
    const { username } = req.body
    User.find({ username })
      .then(user => {
        return res.json({success: true, data: {exist: !!user}})
      })
  }

  public async login(req: Request, res: Response, next: NextFunction) {
    let { username, password } = req.body
    if (username == undefined || password == undefined) {
      return res.json({success: false, msg: '数据不完整'})
    }
    let findUser = await User.find({username})
    if (!findUser) {
      return res.json({success: false, msg: '用户不存在'})
    }

    let checkedUser = await User.checkPassword({username, password})

    if (checkedUser) {
        let token = auth.generateToken({id: checkedUser.id})
        return res.json({success: true, msg: '登录成功', token})
    }

    return res.json({success: false, msg: '用户名或密码错误'})
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

  public async setUserState(req: Request, res: Response) {
    let {userId} = req.params
    let {active} = req.body
    if (active == undefined) {
      return res.json({success: false, msg: '缺少数据'})
    }
    let result = await User.setUserState(userId, JSON.parse(active))
    return res.json({success: result})
  }

  public async setUserAdmin(req: Request, res: Response) {
    let { userId } = req.params
    let { admin } = req.body
    if (admin == undefined) {
      return res.json({success: false, msg: '缺少数据'})
    }
    let user = await User.findById(userId)
    if (!user) {
      return res.json({success: false, msg: '用户不存在'})
    }
    let isAdmin = JSON.parse(admin)
    let result = await User.setUserAdmin(userId, isAdmin)
    return res.json({success: result})
  }

  public async getCurrentUserInfo(req: Request, res: Response) {
    let user: IUser = req.user
    let {username, active, created} = user
    return res.json({username, active, created})
  }

  // 歌单

  public async getUserAllLists(req: Request, res: Response) {
    let { userId } = req.params
    let user = await User.findById(userId)
    if (!user || !user.document) {
      return res.json({success: false, msg: '用户不存在'})
    }
    let findList = await List.find({userid: userId})
    return res.json({success: true, msg: '', data: findList})
  }

  public async createListForUser(req: Request, res: Response) {
    let { name, desc, cover } = req.body
    if (name == undefined && cover == undefined) {
        return res.json({success: false, msg: "缺少字段"})
    }
    let { userId } = req.params
    let user = await User.findById(userId)
    if (!user || !user.document) {
      return res.json({success: false, msg: "用户不存在"})
    }

    let findList = await List.findByName(name, user.document)
    if (findList) {
      return res.json({success: false, msg: '歌单名重复'})
    }

    let list = await List.create(<IList>{name, desc, cover}, user.document)
    let result = list && list.document
    return res.json({success: result})
  }
}

const userRoutes = new UserRouter()

export const userRouter =  userRoutes.router