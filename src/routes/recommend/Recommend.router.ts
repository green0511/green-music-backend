import { Router, Response, Request } from 'express'
import { auth } from '../../auth'
import { Recommend } from './Recommend'
import { User, IUser } from '../user'
import { List } from '../list'

class RecommendRouter {
  router: Router

  constructor() {
    this.router = Router()
    // 获得全部推荐
    this.router.get('/', this.getAll)
    // 根据 id 获取特定记录
    this.router.get('/:recommendId', this.getById)
    // 添加推荐
    this.router.post('/', auth.authenticate, auth.authorize.is('admin'), this.create)
    // 删除歌单
    this.router.delete('/:recommendId', auth.authenticate,  auth.authorize.is('admin'), this.delete)
  }
  
  public async getAll(req: Request, res: Response) {
    let { page, length } = req.query
    page = parseInt(page) || 1
    length = parseInt(length) || 10
    let allRecommends = await Recommend.getAll(page, length)
    let count = await Recommend.getCount({})
    return res.json({success: true, msg: '', data: allRecommends, count})
  }
  
  public async getById(req: Request, res: Response) {
    let { recommendId } = req.params
    let findRecommend = await Recommend.findById(recommendId)
    if (!findRecommend) {
      return res.json({success: false, msg: '记录不存在'})
    }
    return res.json({success: true, msg: '成功', data: findRecommend})
  }

  public async create(req: Request, res: Response) {
    let { listId } = req.body
    if (listId == undefined) {
      return res.json({success: false, msg: '缺少字段'})
    }
    let findList = await List.findById(listId)
    if (!findList) {
      return res.json({success: false, msg: '此歌单不存在'})
    }
    let createdRecommend = await Recommend.create(findList)
    return res.json({success: true, msg: '创建成功', data: createdRecommend})
  }

  private async delete(req: Request, res: Response) {
    let { recommendId } = req.params
    let toBeDelete = await Recommend.findById(recommendId)
    if (!toBeDelete) {
      return res.json({success: false, msg: '记录不存在'})
    }
    Recommend.delete(toBeDelete._id)
      .then(_ => res.json({success: true, msg: '删除成功'}))
      .catch(err => res.json({success: false, msg: '删除失败'}))
  }
}

const recommendRoutes = new RecommendRouter()

export const recommendRouter =  recommendRoutes.router