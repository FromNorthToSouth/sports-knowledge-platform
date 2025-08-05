import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

// 允许的文件类型配置
const ALLOWED_FILE_TYPES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    maxSize: 100 * 1024 * 1024 // 100MB
  },
  audio: {
    extensions: ['.mp3', '.wav', '.aac', '.ogg', '.m4a'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'],
    maxSize: 20 * 1024 * 1024 // 20MB
  },
  document: {
    extensions: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ],
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  '3d_model': {
    extensions: ['.gltf', '.glb', '.fbx', '.obj', '.dae', '.3ds', '.ply', '.stl', '.x3d'],
    mimeTypes: [
      'model/gltf+json',
      'model/gltf-binary', 
      'application/octet-stream',
      'text/plain', // for .obj files
      'application/xml' // for .dae files
    ],
    maxSize: 100 * 1024 * 1024 // 100MB
  }
};

// 生成唯一文件名
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}${ext}`;
};

// 确保目录存在
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 获取文件存储路径
const getStoragePath = (fileType: string, subPath?: string): string => {
  const baseDir = process.env.UPLOAD_DIR || './uploads';
  const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM格式
  const fullPath = path.join(baseDir, fileType, datePath, subPath || '');
  ensureDirectoryExists(fullPath);
  return fullPath;
};

// 检查文件类型
const checkFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  for (const type of allowedTypes) {
    const config = ALLOWED_FILE_TYPES[type as keyof typeof ALLOWED_FILE_TYPES];
    if (config && 
        config.extensions.includes(ext) && 
        config.mimeTypes.includes(mimeType)) {
      return true;
    }
  }
  return false;
};

// 获取文件类型
const getFileType = (file: Express.Multer.File): string => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  
  for (const [type, config] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (config.extensions.includes(ext) || config.mimeTypes.includes(mimeType)) {
      return type;
    }
  }
  return 'other';
};

// 检查文件大小
const checkFileSize = (file: Express.Multer.File, fileType: string): boolean => {
  const config = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
  if (!config) return true; // 如果没有配置，允许通过
  return file.size <= config.maxSize;
};

// 多文件上传存储配置
const createMulterStorage = (options: {
  allowedTypes?: string[];
  subPath?: string;
  preserveOriginalName?: boolean;
} = {}) => {
  return multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
      try {
        const fileType = getFileType(file);
        const storagePath = getStoragePath(fileType, options.subPath);
        cb(null, storagePath);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req: Request, file: Express.Multer.File, cb) => {
      try {
        if (options.preserveOriginalName) {
          cb(null, file.originalname);
        } else {
          const fileName = generateFileName(file.originalname);
          cb(null, fileName);
        }
      } catch (error) {
        cb(error as Error, '');
      }
    }
  });
};

// 文件过滤器
const createFileFilter = (allowedTypes: string[] = ['image', 'video', 'audio', 'document']) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      // 检查文件类型
      if (!checkFileType(file, allowedTypes)) {
        return cb(new Error(`不支持的文件类型: ${file.mimetype}`));
      }
      
      // 检查文件大小
      const fileType = getFileType(file);
      if (!checkFileSize(file, fileType)) {
        const config = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES];
        return cb(new Error(`文件太大，最大允许: ${config?.maxSize / 1024 / 1024}MB`));
      }
      
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  };
};

// 创建上传中间件
export const createUploadMiddleware = (options: {
  allowedTypes?: string[];
  maxFiles?: number;
  subPath?: string;
  preserveOriginalName?: boolean;
  field?: string;
} = {}) => {
  const {
    allowedTypes = ['image', 'video', 'audio', 'document'],
    maxFiles = 10,
    subPath,
    preserveOriginalName = false,
    field = 'files'
  } = options;

  const upload = multer({
    storage: createMulterStorage({ allowedTypes, subPath, preserveOriginalName }),
    fileFilter: createFileFilter(allowedTypes),
    limits: {
      fileSize: Math.max(
        ...allowedTypes.map(type => 
          ALLOWED_FILE_TYPES[type as keyof typeof ALLOWED_FILE_TYPES]?.maxSize || 0
        )
      ),
      files: maxFiles
    }
  });

  if (maxFiles === 1) {
    return upload.single(field);
  } else {
    return upload.array(field, maxFiles);
  }
};

// 常用上传中间件预设
export const uploadMiddleware = {
  // 单个图片上传
  singleImage: createUploadMiddleware({
    allowedTypes: ['image'],
    maxFiles: 1,
    field: 'image'
  }),
  
  // 多个图片上传
  multipleImages: createUploadMiddleware({
    allowedTypes: ['image'],
    maxFiles: 5,
    field: 'images'
  }),
  
  // 单个视频上传
  singleVideo: createUploadMiddleware({
    allowedTypes: ['video'],
    maxFiles: 1,
    field: 'video'
  }),
  
  // 单个音频上传
  singleAudio: createUploadMiddleware({
    allowedTypes: ['audio'],
    maxFiles: 1,
    field: 'audio'
  }),
  
  // 单个文档上传
  singleDocument: createUploadMiddleware({
    allowedTypes: ['document'],
    maxFiles: 1,
    field: 'document'
  }),
  
  // 混合文件上传
  mixed: createUploadMiddleware({
    allowedTypes: ['image', 'video', 'audio', 'document'],
    maxFiles: 10,
    field: 'files'
  }),
  
  // 学习资源上传
  learningResource: createUploadMiddleware({
    allowedTypes: ['image', 'video', 'audio', 'document'],
    maxFiles: 5,
    subPath: 'learning-resources',
    field: 'files'
  }),
  
  // 用户头像上传
  avatar: createUploadMiddleware({
    allowedTypes: ['image'],
    maxFiles: 1,
    subPath: 'avatars',
    field: 'avatar'
  }),
  
  // 知识库内容上传
  knowledgeBase: createUploadMiddleware({
    allowedTypes: ['image', 'video', 'audio', 'document', '3d_model'],
    maxFiles: 10,
    subPath: 'knowledge-base',
    field: 'files'
  })
};

// 文件信息提取器
export const extractFileInfo = (file: Express.Multer.File) => {
  const fileType = getFileType(file);
  const relativePath = path.relative(process.env.UPLOAD_DIR || './uploads', file.path);
  
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    type: fileType,
    path: file.path,
    relativePath,
    url: `/files/${relativePath.replace(/\\/g, '/')}`, // 标准化路径分隔符
    uploadedAt: new Date().toISOString()
  };
};

// 批量文件信息提取
export const extractMultipleFileInfo = (files: Express.Multer.File[]) => {
  return files.map(extractFileInfo);
};

// 清理临时文件
export const cleanupTempFiles = (files: Express.Multer.File[] | Express.Multer.File) => {
  const fileList = Array.isArray(files) ? files : [files];
  
  fileList.forEach(file => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// 移动文件到指定目录
export const moveFile = (sourcePath: string, targetPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 确保目标目录存在
    ensureDirectoryExists(path.dirname(targetPath));
    
    // 移动文件
    fs.rename(sourcePath, targetPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// 创建文件访问URL
export const createFileUrl = (relativePath: string): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/files/${relativePath.replace(/\\/g, '/')}`;
};

export default uploadMiddleware; 