import * as mocha from 'mocha'
import * as chai from 'chai'
import chaiHttp = require('chai-http')

import { getUrl } from '../../src/ghost/url'

chai.use(chaiHttp)
const expect = chai.expect

describe('config', () => {
  it('test url', () => {
    expect(getUrl('posts')).to.equal(`http://45.76.74.70:2368/ghost/api/v0.1/posts/`)
  })
  it('test url query', () => {
    expect(getUrl('posts', {
      limit: 2,
      page: 2
    })).to.equal(`http://45.76.74.70:2368/ghost/api/v0.1/posts/?limit=2&page=2`)
  })
})