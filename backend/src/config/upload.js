import multer from '@koa/multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 磁盘存储配置（用于图片等需要持久化的文件）
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// 内存存储配置（用于Excel导入等临时文件）
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，只允许上传图片、PDF和Office文档'));
  }
};

// 默认使用内存存储（适合Excel导入等场景）
export const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

// 磁盘存储上传（适合图片等需要持久化的文件）
export const uploadToDisk = multer({
  storage: diskStorage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

export default {
  uploadDir,
  maxFileSize,
  upload
};
