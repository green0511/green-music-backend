import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as jwt from 'jsonwebtoken'
import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

import { getUploadedFiles, getUploadMiddleWare } from './uploader'

import { IUser } from '../user'
import { auth } from '../../auth'

let availableTypes = ['covers', 'avatars']

class ImageRoute {
  router: Router

  constructor() {
    this.router = Router()
    this.router.post('/:type', auth.authenticate, auth.authorize.is('admin'), this.upload)
    this.router.get('/:type', this.getAllUrl)
  }
  
  // 上传
  public async upload(req: Request, res: Response, next: NextFunction) {
    let {type} = req.params
    if (availableTypes.indexOf(type) == -1) {
      return res.json({success: false, msg: '不支持此目录类型'}) 
    }
    let user: IUser = req.user

    let middleWare = getUploadMiddleWare(type)
    middleWare(req, res, (err) => {
      if (err) {
        serverDebugger('upload error: ', err)
        let msg = '未知错误'
        if (err.code == 'LIMIT_UNEXPECTED_FILE') {
          msg = '错误字段'
        }
        return res.json({success: false, msg})
      }
      serverDebugger('uploaded file: ', req['file'])
      return res.json({success: true, msg: '上传成功', data: { file: req['file'].filename }})
    })
  }

  public getAllUrl(req: Request, res: Response) {
    let {type} = req.params
    if (availableTypes.indexOf(type) == -1) {
      return res.json({success: false, msg: '不支持此目录类型'}) 
    }
    let host = req.headers.host
    serverDebugger('host: ', host)
    let prefix = 'http://' + host + '/static/' + type +'/'
    getUploadedFiles(type).then(files => res.json({success: true, data: files.map(file => ({name: file, url: prefix + file}))}))
  }

}

const imageRoute = new ImageRoute()

export const imageRouter =  imageRoute.router