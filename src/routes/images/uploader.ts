import * as multer from 'multer'
import * as fs from 'fs'

const MAIN_DIR = './uploads/'

type UploadTypes = 'avatars' | 'covers'

function getDiskStorage(type: UploadTypes) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, MAIN_DIR + type)
    },
    filename: function (req, file, cb) {
      let fileName = file.originalname
      let pointPos = fileName.lastIndexOf('.')
      let subfix = fileName.slice(pointPos)
      cb(null, new Date().getTime().toString() + subfix)
    }
  })
}

export function getUploadMiddleWare(type: UploadTypes) {
  return multer({ 
    storage: getDiskStorage(type),
    fileFilter(req, file, cb) {
      if (file.mimetype.includes('image')) {
        cb(null, true)
      }
      cb(null, false)
    } 
   }).single(type)
}


export function getUploadedFiles(type: UploadTypes) {
  return new Promise<Array<string>>((resolve, reject) => {
    fs.readdir(MAIN_DIR + type, function(err, files) {
      if (err) {
        resolve([])
      }
      resolve(files.filter(file => file !== '.gitkeep'))
    })
  })
}

