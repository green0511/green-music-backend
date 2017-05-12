import { Router, Response, Request } from 'express'
import { auth } from '../../auth'
import { List } from './List'
import { User, IUser } from '../user'

const PLATFORMS = ['qq']

class ListRouter {
  router: Router

  constructor() {
    this.router = Router()
    // 获得全部歌单
    this.router.get('/', this.getAllLists)
    // 根据 id 获取特定歌单
    this.router.get('/:listId', this.getListById)
    // 创建歌单
    this.router.post('/', auth.authenticate, this.createList)
    // 删除歌单
    this.router.delete('/:listId', auth.authenticate, this.deleteList)
    // 修改歌单名和简介
    this.router.put('/:listId', auth.authenticate, this.editList)
    // 向歌单中添加歌曲
    this.router.post('/:listId/songs', auth.authenticate, this.addSongToList)
    // 向歌单中移除歌曲
    this.router.delete('/:listId/songs', auth.authenticate, this.removeSongFromList)
  }
  
  public async getAllLists(req: Request, res: Response) {
    let { page, length } = req.query
    page = parseInt(page) || 1
    length = parseInt(length) || 10
    let findList = await List.find({}, page, length)
    let count = await List.getCount({})
    return res.json({success: true, msg: '', data: findList, count})
  }
  
  public async getListById(req: Request, res: Response) {
    let { listId } = req.params
    let findList = await List.findById(listId)
    if (!findList) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    return res.json({success: true, msg: '成功', data: findList})
  }

  public async createList(req: Request, res: Response) {
    let { name, desc, cover } = req.body
    if (name == undefined || cover == undefined) {
      return res.json({success: false, msg: '缺少字段'})
    }
    let findList = await List.findByName(name, req.user)
    if (findList) {
      return res.json({success: false, msg: '歌单名重复'})
    }
    let createdList = await List.create(req.body, req.user)
    return res.json({success: true, msg: '创建成功', data: createdList})
  }

  private async deleteList(req: Request, res: Response) {
    let { listId } = req.params
    let listToBeDelete = await List.findById(listId)
    if (!listToBeDelete) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    let user: IUser = req.user
    if (listToBeDelete.user.id.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }
    List.delete(listToBeDelete._id)
      .then(_ => res.json({success: true, msg: '删除成功'}))
      .catch(err => res.json({success: false, msg: '删除失败'}))
  }

  private async editList(req: Request, res: Response) {
    let { listId } = req.params
    let {name, desc} = req.body
    let listToBeEdit = await List.findById(listId)
    if (!listToBeEdit) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    let user: IUser = req.user
    if (listToBeEdit.user.id !== user._id && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }
    
    let namedList = await List.findByName(name, user)
    if (namedList) {
      return res.json({success: false, msg: '歌单名已使用'})
    }

    let result = await List.update(listToBeEdit._id, <any>{name, desc})
    let msg = result?'修改成功':'修改失败'
    res.json({success: result, msg})
  }

  private async addSongToList(req: Request, res: Response) {
    let { listId } = req.params

    let list = await List.findById(listId)
    if (!list) {
      return res.json({success: false, msg: '歌单不存在'})
    }

    let user: IUser = req.user
    if (list.user.id.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }

    let { id, platform } = req.body
    if (!id || !platform) {
      return res.json({success: false, msg: '缺少字段'})
    }

    if (PLATFORMS.indexOf(platform) == -1) {
      return res.json({success: false, msg: '未知来源'})
    }

    let alreayContain = list.musics.some(music => {
      return music.id == id && music.platform == platform
    })

    if (alreayContain) {
      return res.json({success: false, msg: '请勿重复添加'})
    }

    let song = {
      id,
      platform,
      date: new Date()
    }

    let result = await List.addSong(list._id, song)
    let msg = result ? "添加成功" : "添加失败"
    return res.json({success: result, msg})

  }

  async removeSongFromList(req: Request, res: Response) {
    let { listId } = req.params

    let list = await List.findById(listId)
    if (!list) {
      return res.json({success: false, msg: '歌单不存在'})
    }

    let user: IUser = req.user
    if (list.user.id.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }

    let { id, platform } = req.body
    if (!id || !platform) {
      return res.json({success: false, msg: '缺少字段'})
    }

    if (PLATFORMS.indexOf(platform) == -1) {
      return res.json({success: false, msg: '未知来源'})
    }

    let musicToRemove = list.musics.find((item) => {
      return item.id == id && item.platform == platform
    })

    if (!musicToRemove) {
      return res.json({success: false, msg: '歌曲不在此列表中'})
    }
    
    let result = await List.removeSong(listId, musicToRemove)
    let msg = result ? '移除成功' : '移除失败'
    return res.json({success: result, msg})

  }
}

const listRoutes = new ListRouter()

export const listRouter =  listRoutes.router