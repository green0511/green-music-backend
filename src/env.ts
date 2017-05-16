const {            // 以下是可用的环境变量
  MONGO_HOST,      // 数据库服务器
  MONGO_PORT,      // 数据库端口
  MONGO_DBNAME,    // 数据库名
  MONGO_USER,      // 数据库登陆用户
  MONGO_PASSWORD,  // 数据库登陆密码
  JWT_SIGN_KEY,    // json web token 加密密钥
  PORT             // 应用运行占用的端口
 } = process.env

export const config: IConfig = {
  db: {
    host: MONGO_HOST || 'localhost',
    port: (MONGO_PORT && parseInt(MONGO_PORT)) || 27017,
    name: MONGO_DBNAME || 'greenmusic',
    user: MONGO_USER,
    password: MONGO_PASSWORD
  },
  jwtSignKey: JWT_SIGN_KEY || 'secrect',
  port: (PORT && parseInt(PORT)) || 3000
}

interface IConfig {
  db: IDatabaseConfig
  jwtSignKey: string
  port: number
}

interface IDatabaseConfig {
  host: string
  port: number
  name: string
  user: string
  password: string
}
