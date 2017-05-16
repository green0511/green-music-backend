import * as mongoose from 'mongoose'
import { connect, connection } from 'mongoose'

import * as debug from 'debug'
let serverDebugger = debug('test:util')

export function resetDatabase(done) {
function clearDb() {
    let collections = connection.collections
    let promiseArr: Array<Promise<any>> = []
    Object.keys(collections).forEach(i => promiseArr.push(collections[i].remove({})))
    Promise.all(promiseArr).then(() => {
      serverDebugger('clearDb done')
      done()
    })
  }

  if (connection.readyState === 0) {
    serverDebugger('no mongodb connection')
    connect('mongodb://localhost:27017/test')
      .then(() => {
        serverDebugger('mongodb connected')
      })
      .catch(err => {
        serverDebugger('mongodb connect err:', err)
      })
      .then(() => {
        serverDebugger('clearing mongodb')
        clearDb()
      })
  } else {
    serverDebugger('already has mongodb connection')
    serverDebugger('clearing mongodb')
    clearDb()
  }
}

export function random() {
  return Math.floor(Math.random() * 10000)
}