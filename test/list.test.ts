import * as mongoose from 'mongoose'
import { connect, connection } from 'mongoose'

import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')

import * as debug from 'debug'
let serverDebugger = debug('test:list')

import { User, IUser } from '../src/routes/user'
import { List, IList, IMusic } from '../src/routes/list'

import { resetDatabase, random } from './util'

// 更换 Mongoose 的默认 Promise 库
;(<any>mongoose)['Promise'] = Promise

chai.use(chaiHttp)

process.env.NODE_ENV = 'test'

describe('测试创建歌单功能', () => {
  
  let user: IUser = <IUser>{
    username: 'testname',
    password: 'testpass',
    avatar: 'testavatar'
  }

  let list: IList = <IList> {
    name: 'testlist',
    desc: 'testdesc',
    cover: 'testcover'
  }

  let testUser: IUser
  let testList: IList
  before((done) => {
    resetDatabase(done)
  })
  before(async () => {
      testUser = await User.create(user)
      testList = await List.create(list, testUser)
  })

  it('歌单应具有正确的歌单名称', () => {
    expect(testList).to.has.property('name')
    expect(testList.name).to.equals(list.name)

  })

  it('歌单应具有正确的简介', () => {
    expect(testList).to.has.property('desc')
    expect(testList.desc).to.equals(list.desc)
  })

  it('应有 cover 字段', () => {
    expect(testList).to.has.property('cover')
    expect(testList.cover).to.equals(list.cover)
  })

  it('应有 musics 字段', () => {
    expect(testList).to.has.property('musics')
    expect(testList.musics).to.be.instanceOf(Array)
  })
  
  it('musics 数组默认为空', () => {
    expect(testList.musics.length).to.be.equals(0)
  })

  it('创建时自动生成 created 字段', () => {
    expect(testList).to.has.property('created')
    expect(testList.created).to.be.instanceOf(Date)
  })

  it('创建时自动生成 updated 字段', () => {
    expect(testList).to.has.property('updated')
    expect(testList.updated).to.be.instanceOf(Date)
  })
})

describe('测试歌单查询功能', () => {
  before((done) => {
    resetDatabase(done)
  })
  let counts = 10

  let allLists: IList[]
  let user: IUser
  
  before(async () => {
    let  testUser: IUser = <IUser>{
        username: 'testname',
        password: 'testpass',
        avatar: 'testavatar'
      }
    user = await User.create(testUser)
  })

  before((done) => {
    let createListPromiseArr: Array<Promise<any>> = []
    for (let i = 0; i < counts; i++) {
      let list: IList = <IList>{
        name: 'name' + random(),
        desc: 'desc' + random(),
        cover: 'cover' + random()
      } 
      createListPromiseArr.push(List.create(list, user))
    }
    Promise.all(createListPromiseArr)
      .then(res => done())
      .catch(err => {
        serverDebugger('批量创建用户错误:', err)
        throw err
      })
  })

  before(async () => {
    allLists = await List.find({})
  })

  it('验证查询所有歌单的总数', async () => {
    let listCount = await List.getCount({})
    expect(typeof listCount).to.be.equals('number')
    expect(listCount).to.equals(counts)
  })

  it('验证所有歌单查询结果', async () => {
    let lists = await List.find({})
    expect(lists).to.be.instanceOf(Array)
    expect(lists.length).to.be.equals(counts)
  })

  it('验证根据ID查询歌单结果', async () => {
    let randomList = allLists[Math.floor(Math.random() * allLists.length)]
    let foundList  = await List.findById(randomList._id)
    expect(foundList.name).to.be.equals(randomList.name)
  })

  it('验证根据歌单名和用户名搜索歌单的结果', async () => {
    let randomList = allLists[Math.floor(Math.random() * allLists.length)]
    let foundList = await List.findByName(randomList.name, user)  
    expect(foundList._id.toString()).to.be.equals(randomList._id.toString())
  })
})

describe('测试删除歌单', async () => {
  before((done) => {
    resetDatabase(done)
  })
  let testUser: IUser
  it('验证删除歌单', async () => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    let savedUser = await User.create(user)
    let list: IList = <IList> {
        name: 'test',
        cover: 'cover'
    }
    let savedList = await List.create(list, savedUser)
    let deletedList = await List.delete(savedList._id)
    let findUser = await List.findById(savedList._id)
    expect(deletedList.name).to.be.equals(savedList.name)
    expect(findUser).to.be.null
  })
})

describe('测试修改歌单功能', () => {
  before((done) => {
    resetDatabase(done)
  })
  let testUser: IUser
  let testList: IList
  before(async () => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    testUser = await User.create(user)
    let list: IList = <IList> {
        name: 'test',
        cover: 'cover'
    }
    testList = await List.create(list, testUser)
  })

  it('验证修改歌单名功能', async () => {
    let changedName = 'changed'
    let res = await List.update(testList._id, <IList>{ name: changedName })
    let after = await List.findById(testList._id)
    expect(after.name).to.be.equals(changedName)
  })
  
  it('验证修改歌单简介功能', async () => {
    let changedDesc = 'changed'
    let res = await List.update(testList._id, <IList>{ desc: changedDesc })
    let after = await List.findById(testList._id)
    expect(after.desc).to.be.equals(changedDesc)
  })

})


describe('测试歌曲相关功能', () => {
  before((done) => {
    resetDatabase(done)
  })

  let testUser: IUser
  let testList: IList
  let song: IMusic = <IMusic> {
    id: 'songid',
    platform: 'qq',
    date: new Date()
  }
  before(async () => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    testUser = await User.create(user)
    let list: IList = <IList> {
        name: 'test',
        cover: 'cover'
    }
    testList = await List.create(list, testUser)
  })
  
  it('测试添加歌曲', async () => {
    await List.addSong(testList._id, song)
    let updatedList = await List.findById(testList._id)
    expect(updatedList.musics.length).to.be.equals(1)
    let addedSong = updatedList.musics[0]
    expect(addedSong.id).equals(song.id)
    expect(addedSong.platform).equals(song.platform)
    expect(addedSong.date.getTime()).equals(song.date.getTime())
  })  

  it('测试移除歌曲', async () => {
    let res = await List.removeSong(testList._id, song)
    expect(res).to.be.true
    let updatedList = await List.findById(testList._id)
    expect(updatedList.musics.length).to.be.equals(0)
  }) 
})

