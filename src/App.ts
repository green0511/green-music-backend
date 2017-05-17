import * as path from 'path'
import * as express from 'express'
import * as logger from 'morgan'
import { userRouter } from './routes/user'
import { listRouter } from './routes/list'
import { imageRouter } from './routes/images'
import { recommendRouter } from './routes/recommend'
import * as bodyParser from 'body-parser'

import { auth } from './auth'

class App {

  public express: express.Application

  constructor() {
    this.express = express()
    this.express.all('*', function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS, HEAD')
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, Access-Control-Allow-Headers, content-type, Authorization')
      next()
    })
    // this.express.
    this.middleware()
    this.routes()
  }

  private middleware(): void {
    this.express.use('/static', express.static('uploads'))
    this.express.use(auth.JwtMiddleware)
    this.express.use(auth.AuthorizeMiddleware)
    this.express.use(logger('dev'))
    this.express.use(bodyParser.json())
    this.express.use(bodyParser.urlencoded({ extended: false }))
  }

  private routes(): void {

    let router = express.Router()
    router.get('/', (req, res, next) => {
      res.json({
        date: new Date()
      })
    })
    this.express.use('/', router)
    this.express.use('/users', userRouter)
    this.express.use('/lists', listRouter)
    this.express.use('/images', imageRouter)
    this.express.use('/recommends', recommendRouter)
  }

}

export default new App().express