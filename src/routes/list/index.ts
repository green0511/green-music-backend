import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as JSONP from 'node-jsonp'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

import { authenticate } from '../../auth'

import { List } from './list.model'

class ListRouter {
  router: Router

  constructor() {
    this.router = Router()
    this.router.post('/', authenticate, this.createList)
    this.router.delete('/:listId', authenticate, this.deleteList)
  }

  public createList(req: Request, res: Response, next: NextFunction) {
    List.create(req.body, req.user)
      .then(list => res.json(list))
      .catch(err => next(err))
  }

  private deleteList(req: Request, res: Response, next: NextFunction) {
    let { listId } = req.params
    List.delete(listId, req.user)
      .then(_ => res.json({success: true}))
      .catch(err => next(err))
  }
}

const listRoutes = new ListRouter()

export const listRouter =  listRoutes.router