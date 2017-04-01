import * as path from 'path'
import * as express from 'express'
import * as logger from 'morgan'
import { userRouter } from './routes/user'
import * as bodyParser from 'body-parser'

import { JwtMiddleware } from './auth'

class App {

  public express: express.Application

  constructor() {
    this.express = express()
    this.middleware()
    this.routes()
  }

  private middleware(): void {
    this.express.use(JwtMiddleware)
    this.express.use(logger('dev'))
    this.express.use(bodyParser.json())
    this.express.use(bodyParser.urlencoded({ extended: false }))
  }

  private routes(): void {

    let router = express.Router()
    router.get('/', (req, res, next) => {
      res.json({
        message: 'Hello Express!'
      })
    })
    this.express.use('/', router)
    this.express.use('/user', userRouter)
  }

}

export default new App().express