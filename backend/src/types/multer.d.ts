declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      size: number
      destination?: string
      filename?: string
      path?: string
      buffer: Buffer
    }
  }

  interface Request {
    files?: Multer.File[]
  }
}

declare module "multer" {
  import { RequestHandler } from "express"

  interface MulterInstance {
    array(fieldName: string): RequestHandler
  }

  interface MulterFactory {
    (options?: unknown): MulterInstance
    memoryStorage(): unknown
  }

  const multer: MulterFactory
  export default multer
}
