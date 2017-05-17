import * as http from 'http'
import * as mongoose from 'mongoose'
import { connect } from 'mongoose'
import App from './App'
import { config } from './env'

// 更换 Mongoose 的默认 Promise 库
(<any>mongoose)['Promise'] = Promise

import * as debug from 'debug'
let serverDebugger = debug('ts-express:server')

let {db, port } = config

let {user, password, name, host, port: dbPort} = db

let dbAuthString = user && password ? `${user}:${password}@` : ''

connect(`mongodb://${dbAuthString}${host}:${dbPort}/${name}`,
  {
    config: { autoIndex: false }
  })
  .then(() => serverDebugger('mongodb connected'))

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error
  let bind = 'Port ' + port
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening(): void {
  let addr = server.address()
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`
  serverDebugger(`listen on ${bind}`)
}

App.set('port', port)

const server = http.createServer(App)
server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
