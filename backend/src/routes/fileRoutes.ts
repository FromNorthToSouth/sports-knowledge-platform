import express from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMiddleware, extractFileInfo, extractMultipleFileInfo } from '../middleware/upload';
import fileService from '../services/fileService';

const router = express.Router();

// 文件上传路由
router.post('/upload/avatar', 
  authenticate, 
  uploadMiddleware.avatar, 
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      const fileMetadata = await fileService.processUploadedFile(
        req.file, 
        req.user.id,
        {
          isPublic: false,
          generateThumbnail: true
        }
      );

      res.json({
        success: true,
        data: fileMetadata
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '上传头像失败',
        error: error.message
      });
    }
  }
);

router.post('/upload/learning-resources', 
  authenticate, 
  authorize('teacher', 'admin', 'super_admin'),
  uploadMiddleware.learningResource, 
  async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      const uploadedFiles = [];
      for (const file of files) {
        const fileMetadata = await fileService.processUploadedFile(
          file, 
          req.user.id,
          {
            isPublic: req.body.isPublic === 'true',
            tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
            description: req.body.description,
            generateThumbnail: true
          }
        );
        uploadedFiles.push(fileMetadata);
      }

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '上传学习资源失败',
        error: error.message
      });
    }
  }
);

router.post('/upload/knowledge-base', 
  authenticate, 
  authorize('teacher', 'admin', 'super_admin'),
  uploadMiddleware.knowledgeBase, 
  async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      const uploadedFiles = [];
      for (const file of files) {
        const fileMetadata = await fileService.processUploadedFile(
          file, 
          req.user.id,
          {
            isPublic: req.body.isPublic === 'true',
            tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
            description: req.body.description,
            generateThumbnail: true
          }
        );
        uploadedFiles.push(fileMetadata);
      }

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '上传知识库文件失败',
        error: error.message
      });
    }
  }
);

router.post('/upload', 
  authenticate, 
  uploadMiddleware.mixed, 
  async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '未选择文件'
        });
      }

      const uploadedFiles = [];
      for (const file of files) {
        const fileMetadata = await fileService.processUploadedFile(
          file, 
          req.user.id,
          {
            isPublic: req.body.isPublic === 'true',
            tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
            description: req.body.description,
            generateThumbnail: req.body.generateThumbnail !== 'false'
          }
        );
        uploadedFiles.push(fileMetadata);
      }

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '上传文件失败',
        error: error.message
      });
    }
  }
);

// 文件下载和访问路由
router.get('/download/:fileId', authenticate, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    const metadata = await fileService.getFileMetadata(fileId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查访问权限
    const hasAccess = await fileService.checkFileAccess(
      fileId, 
      req.user.id, 
      req.user.role,
      req.user.institutionId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问此文件'
      });
    }

    // 记录访问
    await fileService.recordFileAccess(fileId);

    // 设置响应头
    res.setHeader('Content-Type', metadata.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(metadata.originalName)}"`);
    res.setHeader('Content-Length', metadata.size);

    // 发送文件
    if (fs.existsSync(metadata.path)) {
      res.sendFile(path.resolve(metadata.path));
    } else {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '下载文件失败',
      error: error.message
    });
  }
});

// 获取文件信息
router.get('/info/:fileId', authenticate, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    const metadata = await fileService.getFileMetadata(fileId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 检查访问权限
    const hasAccess = await fileService.checkFileAccess(
      fileId, 
      req.user.id, 
      req.user.role,
      req.user.institutionId
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问此文件'
      });
    }

    res.json({
      success: true,
      data: metadata
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取文件信息失败',
      error: error.message
    });
  }
});

// 获取文件列表
router.get('/list', authenticate, async (req: any, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type,
      isPublic,
      tags,
      uploadedBy
    } = req.query;

    const options: any = {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };

    if (type) options.type = type;
    if (isPublic !== undefined) options.isPublic = isPublic === 'true';
    if (tags) options.tags = Array.isArray(tags) ? tags : [tags];
    if (uploadedBy) options.uploadedBy = uploadedBy;

    const result = await fileService.getFileList(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: error.message
    });
  }
});

// 获取我的文件
router.get('/my-files', authenticate, async (req: any, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      type
    } = req.query;

    const options: any = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      uploadedBy: req.user.id
    };

    if (type) options.type = type;

    const result = await fileService.getFileList(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取我的文件失败',
      error: error.message
    });
  }
});

// 更新文件权限
router.put('/permissions/:fileId', 
  authenticate, 
  async (req: any, res) => {
    try {
      const { fileId } = req.params;
      const { isPublic, users, roles, institutions } = req.body;

      const metadata = await fileService.getFileMetadata(fileId);
      if (!metadata) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      // 只有文件所有者或管理员可以修改权限
      if (metadata.uploadedBy !== req.user.id && 
          req.user.role !== 'admin' && 
          req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: '无权修改文件权限'
        });
      }

      const updatedMetadata = await fileService.updateFilePermissions(fileId, {
        isPublic,
        users,
        roles,
        institutions
      });

      res.json({
        success: true,
        data: updatedMetadata
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '更新文件权限失败',
        error: error.message
      });
    }
  }
);

// 删除文件
router.delete('/:fileId', authenticate, async (req: any, res) => {
  try {
    const { fileId } = req.params;
    const metadata = await fileService.getFileMetadata(fileId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 只有文件所有者或管理员可以删除
    if (metadata.uploadedBy !== req.user.id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '无权删除此文件'
      });
    }

    const success = await fileService.deleteFile(fileId);
    
    if (success) {
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件删除失败'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
});

// 批量删除文件
router.delete('/batch', 
  authenticate, 
  authorize('admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { fileIds } = req.body;
      
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的文件ID列表'
        });
      }

      const results = [];
      for (const fileId of fileIds) {
        try {
          const success = await fileService.deleteFile(fileId);
          results.push({ fileId, success });
        } catch (error: any) {
          results.push({ fileId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        data: {
          total: fileIds.length,
          success: successCount,
          failed: fileIds.length - successCount,
          results
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '批量删除文件失败',
        error: error.message
      });
    }
  }
);

// 清理过期文件 (管理员)
router.post('/cleanup', 
  authenticate, 
  authorize('admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { daysOld = 30 } = req.body;
      const deletedCount = await fileService.cleanupExpiredFiles(daysOld);
      
      res.json({
        success: true,
        data: {
          deletedCount,
          message: `清理了 ${deletedCount} 个过期文件`
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '清理文件失败',
        error: error.message
      });
    }
  }
);

// 静态文件服务
router.use('/files', express.static(process.env.UPLOAD_DIR || './uploads'));

export default router; 