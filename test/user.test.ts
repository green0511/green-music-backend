import * as mongoose from 'mongoose'
import { connect, connection } from 'mongoose'

import * as chai from 'chai'
import { expect } from 'chai'
import chaiHttp = require('chai-http')

import * as debug from 'debug'
let serverDebugger = debug('test:user')

import { User, IUser } from '../src/routes/user'

import { resetDatabase, random } from './util'

// 更换 Mongoose 的默认 Promise 库
;(<any>mongoose)['Promise'] = Promise

chai.use(chaiHttp)

process.env.NODE_ENV = 'test'

describe('测试创建用户功能', () => {
  
  let user: IUser = <IUser>{
    username: 'testname',
    password: 'testpass',
    avatar: 'testavatar'
  }
  let testUser: IUser
  before((done) => {
    resetDatabase(done)
  })
  before((done) => {
    User.create(user)
      .then(savedUser => {
        testUser = savedUser
        done()
      })
  })

  it('用户应有正确的用户名', () => {
    expect(testUser).to.has.property('username')
    expect(testUser.username).to.equals(user.username)

  })

  it('密码应当被加密', () => {
    // 密码应当被加密
    expect(testUser.password).to.not.equals(user.password)
  })

  it('应有 avatar 字段', () => {
    expect(testUser.avatar).to.equals(user.avatar)
  })

  it('应默认激活', () => {
    expect(testUser.active).to.be.true
  })

  it('默认角色应为 user', () => {
    expect(testUser.role).to.equals('user')
  })
})

describe('测试用户查询功能', () => {
  before((done) => {
    resetDatabase(done)
  })
  let counts = 10
  let allUsers: IUser[]
  before((done) => {
    let creatUserPromiseArr: Array<Promise<any>> = []
    for (let i = 0; i < counts; i++) {
      let user: IUser = <IUser>{
        username: 'user' + random(),
        password: 'pass' + random(),
        avatar: 'avatar' + random()
      } 
      creatUserPromiseArr.push(User.create(user))
    }
    Promise.all(creatUserPromiseArr)
      .then(res => done())
      .catch(err => {
        serverDebugger('批量创建用户错误:', err)
        throw err
      })
  })

  before(async () => {
    allUsers = await User.getAll()
  })

  it('验证查询所有用户的总数', (done) => {
    User.getAllUsersCount()
      .then(userCount => {
        expect(typeof userCount).to.be.equals('number')
        expect(userCount).to.equals(counts)
        done()
      })
  })

  it('验证所有用户查询结果', (done) => {
    User.getAll()
      .then(users => {
        expect(users).to.be.instanceOf(Array)
        expect(users.length).to.be.equals(counts)
        done()
      })
  })

  it('验证根据ID查询单个用户结果', async () => {
    let randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
    let userId = randomUser._id
    let foundUser = await User.findById(randomUser._id)
    expect(foundUser.username).to.be.equals(randomUser.username)
  })

  it('验证根据用户名搜索用户的结果', async () => {
    let randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
    let foundUser = await User.find({username: randomUser.username})    
    expect(foundUser._id.toString()).to.be.equals(randomUser._id.toString())
  })
})

describe('测试修改用户信息功能', () => {
  before((done) => {
    resetDatabase(done)
  })
  let testUser: IUser
  before((done) => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    User.create(user)
      .then(savedUser => {
        testUser = savedUser
        done()
      })
  })

  it('验证修改用户状态功能', async () => {
    let preState = testUser.active
    let res = await User.setUserState(testUser._id, !preState)
    let after = await User.findById(testUser._id)
    expect(after.active).to.be.equals(!preState)
  })
  
  it('验证修改用户角色功能', async () => {
    let isAdmin = testUser.role == 'admin'
    let res = await User.setUserAdmin(testUser._id, !isAdmin)
    let after = await User.findById(testUser._id)
    expect(after.role == 'admin').to.be.equals(!isAdmin)
  })

})

describe('测试删除用户', async () => {
  before((done) => {
    resetDatabase(done)
  })
  let testUser: IUser
  it('验证删除用户', async () => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    let savedUser = await User.create(user)
    let res = await User.remove(savedUser._id)
    let findUser = await User.findById(savedUser._id)
    expect(findUser).to.be.null
  })
})

describe('测试其余功能', () => {
  before((done) => {
    resetDatabase(done)
  })
  it('测试密码验证', async () => {
    let user: IUser = <IUser> {
      username: 'test',
      password: 'test',
      avatar: 'test.jpg'
    }
    let savedUser = await User.create(user)
    let checkResult = await User.checkPassword(user.password, savedUser.password)
    expect(checkResult).to.be.true
    // 错误密码应当返回 false
    let wrongResult = await User.checkPassword('wrongpassword', savedUser.password)
    expect(wrongResult).to.be.false
  })  
})

