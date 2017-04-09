import * as ConnectRoles from 'connect-roles'

export const UserAuthorize = new ConnectRoles({
  failureHandler: function (req, res, action) {
    res.status(403).send({message: 'Access Denied'})
  }
})

UserAuthorize.use('admin', function (req) {
  if (req.user.role === 'admin') {
    return true
  }
})

export const AuthorizeMiddleware = UserAuthorize.middleware()