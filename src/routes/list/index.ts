import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as JSONP from 'node-jsonp'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

import { auth } from '../../auth'

import { IUser } from '../user/user.model'
import { List } from './list.model'

class ListRouter {
  router: Router

  constructor() {
    this.router = Router()
    // 获得全部歌单
    this.router.get('/', auth.authenticate, this.getAllMyLists)
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
  }
  
  public async getAllMyLists(req: Request, res: Response, next: NextFunction) {
    let findList = await List.find({userid: req.user.id})
    return res.json({success: true, msg: '', data: findList})
  }
  
  public async getListById(req: Request, res: Response, next: NextFunction) {
    let { listId } = req.params
    let findList = await List.findById(listId)
    if (!findList) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    return res.json({success: true, msg: '成功', data: findList})
  }

  public async createList(req: Request, res: Response, next: NextFunction) {
    let {name, desc} = req.body
    let findList = await List.findByName(name, req.user)
    if (findList) {
      return res.json({success: false, msg: '歌单名重复'})
    }
    let createdList = await List.create(req.body, req.user)
    return res.json({success: true, msg: '创建成功', data: createdList})
  }

  private async deleteList(req: Request, res: Response, next: NextFunction) {
    let { listId } = req.params
    let listToBeDelete = await List.findById(listId)
    if (!listToBeDelete) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    let user: IUser = req.user
    if (listToBeDelete.userid !== user._id && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }
    List.delete(listToBeDelete._id)
      .then(_ => res.json({success: true, msg: '删除成功'}))
      .catch(err => res.json({success: false, msg: '删除失败'}))
  }

  private async editList(req: Request, res: Response, next: NextFunction) {
    let { listId } = req.params
    let {name, desc} = req.body
    let listToBeEdit = await List.findById(listId)
    if (!listToBeEdit) {
      return res.json({success: false, msg: '歌单不存在'})
    }
    let user: IUser = req.user
    if (listToBeEdit.userid !== user._id && user.role !== 'admin') {
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

  private async addSongToList(req: Request, res: Response, next: NextFunction) {
    let { listId } = req.params

    let list = await List.findById(listId)
    if (!list) {
      return res.json({success: false, msg: '歌单不存在'})
    }

    let user: IUser = req.user
    if (list.userid !== user._id && user.role !== 'admin') {
      return res.json({success: false, msg: '权限不足'})
    }

    let { id, platform } = req.body
    if (!id || !platform) {
      return res.json({success: false, msg: '缺少字段'})
    }

    if (['qq'].indexOf(platform) == -1) {
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
}

const listRoutes = new ListRouter()

export const listRouter =  listRoutes.router