import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | '3d_animation' | 'presentation' | 'other';
  path: string;
  relativePath: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
  description?: string;
  isPublic: boolean;
  accessPermissions?: {
    users?: string[];
    roles?: string[];
    institutions?: string[];
  };
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    bitrate?: number;
    fps?: number;
    // 3D动画相关
    vertices?: number;
    faces?: number;
    materials?: number;
    animations?: number;
    fileVersion?: string;
    // 文档相关
    pageCount?: number;
    // 演示文稿相关
    slideCount?: number;
  };
  downloadCount: number;
  lastAccessedAt?: Date;
}

class FileService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // 确保上传目录存在
    this.ensureDirectoryExists(this.uploadDir);
    this.ensureDirectoryExists(path.join(this.uploadDir, 'thumbnails'));
  }

  // 确保目录存在
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // 生成文件ID
  private generateFileId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  // 保存文件元数据
  async saveFileMetadata(fileData: Partial<FileMetadata>): Promise<FileMetadata> {
    const fileId = this.generateFileId();
    const metadata: FileMetadata = {
      id: fileId,
      filename: fileData.filename || '',
      originalName: fileData.originalName || '',
      mimetype: fileData.mimetype || '',
      size: fileData.size || 0,
      type: fileData.type || 'other',
      path: fileData.path || '',
      relativePath: fileData.relativePath || '',
      url: fileData.url || '',
      uploadedBy: fileData.uploadedBy || '',
      uploadedAt: fileData.uploadedAt || new Date(),
      isPublic: fileData.isPublic || false,
      downloadCount: 0,
      ...fileData
    };

    // 这里应该保存到数据库，现在先保存到JSON文件
    const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
    this.ensureDirectoryExists(path.dirname(metadataPath));
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  // 获取文件元数据
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
      if (!fs.existsSync(metadataPath)) {
        return null;
      }
      const data = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      return null;
    }
  }

  // 更新文件元数据
  async updateFileMetadata(fileId: string, updates: Partial<FileMetadata>): Promise<FileMetadata | null> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      return null;
    }

    const updatedMetadata = { ...metadata, ...updates };
    const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    return updatedMetadata;
  }

  // 生成图片缩略图
  async generateImageThumbnail(imagePath: string, thumbnailPath: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}): Promise<string> {
    const { width = 300, height = 300, quality = 80 } = options;

    try {
      await sharp(imagePath)
        .resize(width, height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      console.error('生成图片缩略图失败:', error);
      throw error;
    }
  }

  // 生成视频缩略图
  async generateVideoThumbnail(videoPath: string, thumbnailPath: string, options: {
    timeSeek?: string;
    width?: number;
    height?: number;
  } = {}): Promise<string> {
    const { timeSeek = '00:00:01', width = 300, height = 300 } = options;

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timeSeek)
        .outputOptions([
          '-vframes 1',
          `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          '-q:v 2'
        ])
        .output(thumbnailPath)
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject)
        .run();
    });
  }

  // 获取图片信息
  async getImageMetadata(imagePath: string): Promise<any> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        channels: metadata.channels,
        density: metadata.density
      };
    } catch (error) {
      console.error('获取图片元数据失败:', error);
      return null;
    }
  }

  // 获取视频信息
  async getVideoMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');
          
          resolve({
            duration: metadata.format.duration,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: videoStream?.r_frame_rate,
            videoCodec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name
          });
        }
      });
    });
  }

  // 获取3D模型文件信息（基础实现）
  async get3DModelMetadata(filePath: string): Promise<any> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      // 基础信息
      const metadata: any = {
        format: ext.replace('.', ''),
        fileSize: stats.size,
        lastModified: stats.mtime
      };
      
      // 对于GLTF文件，尝试读取更多信息
      if (ext === '.gltf') {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const gltfData = JSON.parse(content);
          
          metadata.fileVersion = gltfData.asset?.version || 'unknown';
          metadata.generator = gltfData.asset?.generator || 'unknown';
          
          // 统计信息
          if (gltfData.meshes) {
            let totalVertices = 0;
            let totalFaces = 0;
            
            gltfData.meshes.forEach((mesh: any) => {
              if (mesh.primitives) {
                mesh.primitives.forEach((primitive: any) => {
                  if (primitive.attributes?.POSITION !== undefined && gltfData.accessors) {
                    const accessor = gltfData.accessors[primitive.attributes.POSITION];
                    if (accessor) {
                      totalVertices += accessor.count || 0;
                    }
                  }
                  if (primitive.indices !== undefined && gltfData.accessors) {
                    const accessor = gltfData.accessors[primitive.indices];
                    if (accessor) {
                      totalFaces += (accessor.count || 0) / 3;
                    }
                  }
                });
              }
            });
            
            metadata.vertices = totalVertices;
            metadata.faces = Math.floor(totalFaces);
          }
          
          metadata.materials = gltfData.materials?.length || 0;
          metadata.animations = gltfData.animations?.length || 0;
          metadata.scenes = gltfData.scenes?.length || 0;
          metadata.nodes = gltfData.nodes?.length || 0;
          
        } catch (parseError) {
          console.warn('解析GLTF文件失败:', parseError);
        }
      }
      
      return metadata;
    } catch (error) {
      console.error('获取3D模型元数据失败:', error);
      return null;
    }
  }

  // 为3D模型生成缩略图（使用默认图标）
  async generate3DModelThumbnail(modelPath: string, thumbnailPath: string): Promise<string> {
    try {
      // 创建一个简单的3D图标作为缩略图
      const iconSvg = `
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="300" fill="#f0f2f5"/>
          <g transform="translate(150,150)">
            <!-- 3D立方体图标 -->
            <polygon points="-60,-40 -20,-60 20,-60 60,-40 60,40 20,60 -20,60 -60,40" 
                     fill="#1890ff" opacity="0.8"/>
            <polygon points="-60,-40 -20,-60 20,-60 20,20 -20,20 -60,0" 
                     fill="#40a9ff" opacity="0.9"/>
            <polygon points="60,-40 60,40 20,60 20,20" 
                     fill="#096dd9" opacity="0.7"/>
            <!-- 文件类型标识 -->
            <text x="0" y="80" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
              3D MODEL
            </text>
          </g>
        </svg>
      `;
      
      // 将SVG转换为PNG
      await sharp(Buffer.from(iconSvg))
        .png()
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      console.error('生成3D模型缩略图失败:', error);
      throw error;
    }
  }

  // 获取文档页数（简单实现）
  async getDocumentMetadata(filePath: string): Promise<any> {
    try {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      const metadata: any = {
        format: ext.replace('.', ''),
        fileSize: stats.size,
        lastModified: stats.mtime
      };
      
      // 这里可以集成PDF解析库来获取页数等信息
      // 目前只返回基础信息
      if (ext === '.pdf') {
        // 可以使用pdf-parse或类似库来获取页数
        metadata.pageCount = 1; // 占位符
      }
      
      return metadata;
    } catch (error) {
      console.error('获取文档元数据失败:', error);
      return null;
    }
  }

  // 处理上传的文件
  async processUploadedFile(file: Express.Multer.File, uploadedBy: string, options: {
    isPublic?: boolean;
    tags?: string[];
    description?: string;
    generateThumbnail?: boolean;
  } = {}): Promise<FileMetadata> {
    const { isPublic = false, tags, description, generateThumbnail = true } = options;
    
    // 确定文件类型
    const fileType = this.getFileType(file.mimetype);
    const relativePath = path.relative(this.uploadDir, file.path);
    const url = this.createFileUrl(relativePath);

    // 基础文件元数据
    let fileMetadata: Partial<FileMetadata> = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      type: fileType,
      path: file.path,
      relativePath,
      url,
      uploadedBy,
      uploadedAt: new Date(),
      isPublic,
      tags,
      description
    };

    // 生成缩略图并获取媒体信息
    if (generateThumbnail) {
      try {
        if (fileType === 'image') {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${file.filename}.jpg`);
          await this.generateImageThumbnail(file.path, thumbnailPath);
          const thumbnailRelativePath = path.relative(this.uploadDir, thumbnailPath);
          fileMetadata.thumbnailUrl = this.createFileUrl(thumbnailRelativePath);
          
          // 获取图片信息
          const imageInfo = await this.getImageMetadata(file.path);
          if (imageInfo) {
            fileMetadata.metadata = imageInfo;
          }
        } else if (fileType === 'video') {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${file.filename}.jpg`);
          await this.generateVideoThumbnail(file.path, thumbnailPath);
          const thumbnailRelativePath = path.relative(this.uploadDir, thumbnailPath);
          fileMetadata.thumbnailUrl = this.createFileUrl(thumbnailRelativePath);
          
          // 获取视频信息
          const videoInfo = await this.getVideoMetadata(file.path);
          if (videoInfo) {
            fileMetadata.metadata = videoInfo;
          }
        } else if (fileType === '3d_animation') {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${file.filename}.jpg`);
          await this.generate3DModelThumbnail(file.path, thumbnailPath);
          const thumbnailRelativePath = path.relative(this.uploadDir, thumbnailPath);
          fileMetadata.thumbnailUrl = this.createFileUrl(thumbnailRelativePath);

          // 获取3D模型信息
          const modelInfo = await this.get3DModelMetadata(file.path);
          if (modelInfo) {
            fileMetadata.metadata = modelInfo;
          }
        } else if (fileType === 'document') {
          const thumbnailPath = path.join(this.uploadDir, 'thumbnails', `${file.filename}.jpg`);
          await this.generateImageThumbnail(file.path, thumbnailPath); // 文档缩略图通常是图片
          const thumbnailRelativePath = path.relative(this.uploadDir, thumbnailPath);
          fileMetadata.thumbnailUrl = this.createFileUrl(thumbnailRelativePath);

          // 获取文档信息
          const documentInfo = await this.getDocumentMetadata(file.path);
          if (documentInfo) {
            fileMetadata.metadata = documentInfo;
          }
        }
      } catch (error) {
        console.error('处理媒体文件失败:', error);
        // 继续处理，不因缩略图失败而中断
      }
    }

    // 保存文件元数据
    const savedMetadata = await this.saveFileMetadata(fileMetadata);
    return savedMetadata;
  }

  // 检查文件访问权限
  async checkFileAccess(fileId: string, userId: string, userRole: string, institutionId?: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      return false;
    }

    // 公开文件
    if (metadata.isPublic) {
      return true;
    }

    // 文件所有者
    if (metadata.uploadedBy === userId) {
      return true;
    }

    // 管理员权限
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    // 检查特定权限
    if (metadata.accessPermissions) {
      const { users, roles, institutions } = metadata.accessPermissions;
      
      if (users && users.includes(userId)) {
        return true;
      }
      
      if (roles && roles.includes(userRole)) {
        return true;
      }
      
      if (institutions && institutionId && institutions.includes(institutionId)) {
        return true;
      }
    }

    return false;
  }

  // 更新文件访问权限
  async updateFilePermissions(fileId: string, permissions: {
    isPublic?: boolean;
    users?: string[];
    roles?: string[];
    institutions?: string[];
  }): Promise<FileMetadata | null> {
    const updates: Partial<FileMetadata> = {
      isPublic: permissions.isPublic,
      accessPermissions: {
        users: permissions.users,
        roles: permissions.roles,
        institutions: permissions.institutions
      }
    };

    return await this.updateFileMetadata(fileId, updates);
  }

  // 记录文件访问
  async recordFileAccess(fileId: string): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);
    if (metadata) {
      await this.updateFileMetadata(fileId, {
        downloadCount: metadata.downloadCount + 1,
        lastAccessedAt: new Date()
      });
    }
  }

  // 删除文件
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return false;
      }

      // 删除实际文件
      if (fs.existsSync(metadata.path)) {
        fs.unlinkSync(metadata.path);
      }

      // 删除缩略图
      if (metadata.thumbnailUrl) {
        const thumbnailPath = path.join(this.uploadDir, path.relative(`${this.baseUrl}/files`, metadata.thumbnailUrl));
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // 删除元数据文件
      const metadataPath = path.join(this.uploadDir, 'metadata', `${fileId}.json`);
      if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
      }

      return true;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  // 获取文件类型
  private getFileType(mimetype: string): 'image' | 'video' | 'audio' | 'document' | '3d_animation' | 'presentation' | 'other' {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    
    // 3D动画文件类型
    if (mimetype.includes('gltf') || 
        mimetype.includes('glb') || 
        mimetype.includes('fbx') || 
        mimetype.includes('obj') || 
        mimetype.includes('dae') || 
        mimetype.includes('3ds') || 
        mimetype.includes('ply') || 
        mimetype.includes('stl') || 
        mimetype.includes('x3d') || 
        mimetype.includes('collada') ||
        mimetype === 'model/gltf+json' ||
        mimetype === 'model/gltf-binary' ||
        mimetype === 'application/octet-stream') {
      return '3d_animation';
    }
    
    // 演示文稿文件类型
    if (mimetype.includes('presentation') || 
        mimetype.includes('powerpoint') || 
        mimetype.includes('pptx') || 
        mimetype.includes('ppt') || 
        mimetype.includes('odp')) {
      return 'presentation';
    }
    
    // 文档文件类型
    if (mimetype.includes('pdf') || 
        mimetype.includes('document') || 
        mimetype.includes('spreadsheet') || 
        mimetype.includes('text/') ||
        mimetype.includes('word') ||
        mimetype.includes('docx') ||
        mimetype.includes('doc') ||
        mimetype.includes('xlsx') ||
        mimetype.includes('xls') ||
        mimetype.includes('odt') ||
        mimetype.includes('ods')) {
      return 'document';
    }
    
    return 'other';
  }

  // 创建文件URL
  private createFileUrl(relativePath: string): string {
    return `${this.baseUrl}/files/${relativePath.replace(/\\/g, '/')}`;
  }

  // 获取文件列表
  async getFileList(options: {
    uploadedBy?: string;
    type?: string;
    isPublic?: boolean;
    tags?: string[];
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ files: FileMetadata[]; total: number }> {
    try {
      const metadataDir = path.join(this.uploadDir, 'metadata');
      if (!fs.existsSync(metadataDir)) {
        return { files: [], total: 0 };
      }

      const files = fs.readdirSync(metadataDir)
        .filter(filename => filename.endsWith('.json'))
        .map(filename => {
          try {
            const filePath = path.join(metadataDir, filename);
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as FileMetadata;
          } catch (error) {
            return null;
          }
        })
        .filter((metadata): metadata is FileMetadata => metadata !== null);

      // 应用过滤条件
      let filteredFiles = files;

      if (options.uploadedBy) {
        filteredFiles = filteredFiles.filter(f => f.uploadedBy === options.uploadedBy);
      }

      if (options.type) {
        filteredFiles = filteredFiles.filter(f => f.type === options.type);
      }

      if (options.isPublic !== undefined) {
        filteredFiles = filteredFiles.filter(f => f.isPublic === options.isPublic);
      }

      if (options.tags && options.tags.length > 0) {
        filteredFiles = filteredFiles.filter(f => 
          f.tags && f.tags.some(tag => options.tags!.includes(tag))
        );
      }

      // 分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedFiles = filteredFiles
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(startIndex, endIndex);

      return {
        files: paginatedFiles,
        total: filteredFiles.length
      };
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return { files: [], total: 0 };
    }
  }

  // 清理过期文件
  async cleanupExpiredFiles(daysOld: number = 30): Promise<number> {
    try {
      const metadataDir = path.join(this.uploadDir, 'metadata');
      if (!fs.existsSync(metadataDir)) {
        return 0;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = fs.readdirSync(metadataDir)
        .filter(filename => filename.endsWith('.json'));

      let deletedCount = 0;

      for (const filename of files) {
        try {
          const filePath = path.join(metadataDir, filename);
          const data = fs.readFileSync(filePath, 'utf-8');
          const metadata = JSON.parse(data) as FileMetadata;

          if (new Date(metadata.uploadedAt) < cutoffDate && 
              (!metadata.lastAccessedAt || new Date(metadata.lastAccessedAt) < cutoffDate)) {
            if (await this.deleteFile(metadata.id)) {
              deletedCount++;
            }
          }
        } catch (error) {
          console.error(`处理文件 ${filename} 失败:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('清理过期文件失败:', error);
      return 0;
    }
  }
}

export default new FileService(); 