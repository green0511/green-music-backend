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
  }

  public createList(req: Request, res: Response, next: NextFunction) {
    List.create(req.body, req.user)
      .then(list => res.json(list))
      .catch(err => next(err))
  }
}

const listRoutes = new ListRouter()

export const listRouter =  listRoutes.router