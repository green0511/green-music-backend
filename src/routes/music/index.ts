import * as http from 'http'
import { Router, Request, Response, NextFunction } from 'express'
import * as JSONP from 'node-jsonp'
import * as debug from 'debug'
import * as jwt from 'jsonwebtoken'

let serverDebugger = debug('ts-express:server')

class MusicRouter {
  router: Router

  constructor() {
    this.router = Router()
    this.router.get('/:id', this.getSongInfo)
    this.router.post('/', this.searchQqMusic)
  }

  public getSongInfo(req: Request, res: Response, next: NextFunction) {
    let { id } = req.params
    // https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg
    // 搜索一首歌的详情
    JSONP('https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg', {
      songmid: id,
      format:'jsonp'
    }, 'callback', songInfoData => {
      let { data, url } = songInfoData
      if (!data[0]) {
        return res.json({ err: 'not found' })
      }
      // let singers = data.singer.itemlist
      // singers.forEach(singer => singer.pic = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${singer.mid}.jpg`)
      let { singer, time_public, title, album, interval, mid } = data[0]
      singer.forEach(singer => singer.pic = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${singer.mid}.jpg`)
      album.pic = `https://y.gtimg.cn/music/photo_new/T002R300x300M000${album.mid}.jpg`
      let response = {
        mid,
        interval,
        album,
        singers: singer,
        timePublic: time_public,
        title,
        url: url[Object.keys(url)[0]]
      }
      return res.json(response)
    })
  }

  public searchQqMusic (req: Request, res: Response, next: NextFunction) {
    let { keyword }  = req.body
    try {
      // 根据关键词搜索出歌手/歌曲
      JSONP('https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg', {
        key: keyword,
        format: 'jsonp',
      }, 'jsonpCallback', searchRes => {
        let { data } = searchRes
        let singers = data.singer.itemlist
        singers.forEach(singer => singer.pic = `https://y.gtimg.cn/music/photo_new/T001R300x300M000${singer.mid}.jpg`)
        let response = {
          singers,
          songs: data.song.itemlist
        }
        return res.json(response)
      })
    } catch(err) {
      return res.json({error: true})
    }
  }

}

const musicRoutes = new MusicRouter()

export const musicRouter =  musicRoutes.router
