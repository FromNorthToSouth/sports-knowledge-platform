import { KnowledgePoint, KnowledgeRelation, IKnowledgePoint } from '../models/KnowledgePoint';
import { LearningPath, ILearningPath } from '../models/KnowledgeBase';
import { KnowledgeBase } from '../models/KnowledgeBase';
import User from '../models/User';
import mongoose from 'mongoose';

interface SearchOptions {
  query?: string;
  knowledgeBaseId?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  status?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CollaborationSession {
  knowledgePointId: string;
  userId: string;
  username: string;
  section: string;
  joinedAt: Date;
  lastActivity: Date;
}

class KnowledgeService {
  private collaborationSessions: Map<string, CollaborationSession[]> = new Map();

  // 创建知识点
  async createKnowledgePoint(data: Partial<IKnowledgePoint>, authorId: string): Promise<IKnowledgePoint> {
    try {
      const author = await User.findById(authorId).select('username').lean();
      if (!author) {
        throw new Error('作者不存在');
      }

      // 验证知识库是否存在
      const knowledgeBase = await KnowledgeBase.findById(data.knowledgeBaseId);
      if (!knowledgeBase) {
        throw new Error('知识库不存在');
      }

      // 生成搜索关键词
      const searchKeywords = this.generateSearchKeywords(data.title || '', data.content || '', data.tags || []);

      const knowledgePoint = new KnowledgePoint({
        ...data,
        metadata: {
          authorId,
          authorName: author.username,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedBy: authorId,
          searchKeywords,
          language: 'zh-CN'
        },
        version: {
          current: '1.0',
          history: []
        },
        collaboration: {
          isLocked: false,
          currentEditors: [],
          pendingChanges: []
        },
        quality: {
          completeness: this.calculateCompleteness(data),
          accuracy: 0,
          clarity: 0,
          upToDate: 100,
          overallScore: 0,
          issues: []
        },
        statistics: {
          views: 0,
          uniqueViews: 0,
          completions: 0,
          averageTimeSpent: 0,
          rating: 0,
          ratingCount: 0,
          difficulty: 0,
          popularityScore: 0
        },
        permissions: {
          read: [authorId],
          write: [authorId],
          admin: [authorId]
        },
        automation: {
          autoUpdate: false,
          syncSources: [],
          aiSuggestions: []
        }
      });

      const savedKnowledgePoint = await knowledgePoint.save();

      // 更新知识库统计
      await this.updateKnowledgeBaseStats(data.knowledgeBaseId!);

      return savedKnowledgePoint;
    } catch (error) {
      console.error('创建知识点失败:', error);
      throw error;
    }
  }

  // 更新知识点
  async updateKnowledgePoint(
    id: string, 
    updates: Partial<IKnowledgePoint>, 
    userId: string,
    reason?: string
  ): Promise<IKnowledgePoint> {
    try {
      const knowledgePoint = await KnowledgePoint.findById(id);
      if (!knowledgePoint) {
        throw new Error('知识点不存在');
      }

      // 权限检查
      if (!this.hasWritePermission(knowledgePoint, userId)) {
        throw new Error('无权修改此知识点');
      }

      // 检查是否被锁定
      if (knowledgePoint.collaboration.isLocked && 
          knowledgePoint.collaboration.lockedBy !== userId) {
        throw new Error('知识点已被其他用户锁定编辑');
      }

             // 更新搜索关键词和元数据
       const metadataUpdates: any = {
         updatedAt: new Date(),
         lastModifiedBy: userId,
         modificationReason: reason
       };

       if (updates.title || updates.content || updates.tags) {
         metadataUpdates.searchKeywords = this.generateSearchKeywords(
           updates.title || knowledgePoint.title,
           updates.content || knowledgePoint.content,
           updates.tags || knowledgePoint.tags
         );
       }

       // 合并元数据更新
       Object.keys(metadataUpdates).forEach(key => {
         (updates as any)[`metadata.${key}`] = metadataUpdates[key];
       });

      // 重新计算质量分数
      if (updates.content || updates.sections) {
        updates.quality = {
          ...knowledgePoint.quality,
          completeness: this.calculateCompleteness({
            content: updates.content || knowledgePoint.content,
            sections: updates.sections || knowledgePoint.sections,
            mediaFiles: updates.mediaFiles || knowledgePoint.mediaFiles,
            exercises: updates.exercises || knowledgePoint.exercises
          })
        };
      }

      const updatedKnowledgePoint = await KnowledgePoint.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      return updatedKnowledgePoint!;
    } catch (error) {
      console.error('更新知识点失败:', error);
      throw error;
    }
  }

  // 搜索知识点
  async searchKnowledgePoints(options: SearchOptions): Promise<{
    knowledgePoints: IKnowledgePoint[];
    total: number;
    facets?: any;
  }> {
    try {
      const {
        query,
        knowledgeBaseId,
        category,
        difficulty,
        tags,
        status,
        authorId,
        page = 1,
        pageSize = 20,
        sortBy = 'metadata.createdAt',
        sortOrder = 'desc'
      } = options;

      // 构建搜索条件
      const searchQuery: any = {};

      if (knowledgeBaseId) {
        searchQuery.knowledgeBaseId = knowledgeBaseId;
      }

      if (category) {
        searchQuery.category = category;
      }

      if (difficulty) {
        searchQuery.difficulty = difficulty;
      }

      if (tags && tags.length > 0) {
        searchQuery.tags = { $in: tags };
      }

      if (status) {
        searchQuery.status = status;
      }

      if (authorId) {
        searchQuery['metadata.authorId'] = authorId;
      }

      // 文本搜索
      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { summary: { $regex: query, $options: 'i' } },
          { 'metadata.searchKeywords': { $in: [new RegExp(query, 'i')] } }
        ];
      }

      const skip = (page - 1) * pageSize;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [knowledgePoints, total] = await Promise.all([
        KnowledgePoint.find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(pageSize)
          .lean(),
        KnowledgePoint.countDocuments(searchQuery)
      ]);

      // 计算搜索分面（facets）
      const facets = await this.calculateSearchFacets(searchQuery);

      return {
        knowledgePoints,
        total,
        facets
      };
    } catch (error) {
      console.error('搜索知识点失败:', error);
      throw error;
    }
  }

  // 开始协作编辑
  async startCollaboration(knowledgePointId: string, userId: string, section?: string): Promise<void> {
    try {
      const user = await User.findById(userId).select('username').lean();
      if (!user) {
        throw new Error('用户不存在');
      }

      const knowledgePoint = await KnowledgePoint.findById(knowledgePointId);
      if (!knowledgePoint) {
        throw new Error('知识点不存在');
      }

      // 权限检查
      if (!this.hasWritePermission(knowledgePoint, userId)) {
        throw new Error('无权编辑此知识点');
      }

      // 检查是否已经在编辑
      const existingEditor = knowledgePoint.collaboration.currentEditors.find(
        editor => editor.userId === userId
      );

      if (!existingEditor) {
        // 添加到当前编辑者列表
        await KnowledgePoint.findByIdAndUpdate(knowledgePointId, {
          $push: {
            'collaboration.currentEditors': {
              userId,
              username: user.username,
              joinedAt: new Date(),
              section
            }
          }
        });

        // 更新内存中的协作会话
        const sessions = this.collaborationSessions.get(knowledgePointId) || [];
        sessions.push({
          knowledgePointId,
          userId,
          username: user.username,
          section: section || 'general',
          joinedAt: new Date(),
          lastActivity: new Date()
        });
        this.collaborationSessions.set(knowledgePointId, sessions);
      }

      console.log(`用户 ${user.username} 开始协作编辑知识点 ${knowledgePointId}`);
    } catch (error) {
      console.error('开始协作编辑失败:', error);
      throw error;
    }
  }

  // 结束协作编辑
  async endCollaboration(knowledgePointId: string, userId: string): Promise<void> {
    try {
      await KnowledgePoint.findByIdAndUpdate(knowledgePointId, {
        $pull: {
          'collaboration.currentEditors': { userId }
        }
      });

      // 更新内存中的协作会话
      const sessions = this.collaborationSessions.get(knowledgePointId) || [];
      const updatedSessions = sessions.filter(session => session.userId !== userId);
      
      if (updatedSessions.length > 0) {
        this.collaborationSessions.set(knowledgePointId, updatedSessions);
      } else {
        this.collaborationSessions.delete(knowledgePointId);
      }

      console.log(`用户 ${userId} 结束协作编辑知识点 ${knowledgePointId}`);
    } catch (error) {
      console.error('结束协作编辑失败:', error);
      throw error;
    }
  }

  // 创建学习路径
  async createLearningPath(data: Partial<ILearningPath>, authorId: string): Promise<ILearningPath> {
    try {
      const author = await User.findById(authorId).select('username').lean();
      if (!author) {
        throw new Error('作者不存在');
      }

      const learningPath = new LearningPath({
        ...data,
        authorId,
        authorName: author.username,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedLearningPath = await learningPath.save();
      return savedLearningPath;
    } catch (error) {
      console.error('创建学习路径失败:', error);
      throw error;
    }
  }

  // 获取知识图谱
  async getKnowledgeGraph(knowledgeBaseId: string, options: {
    depth?: number;
    relationTypes?: string[];
    minStrength?: number;
  } = {}): Promise<{
    nodes: Array<{
      id: string;
      title: string;
      category: string;
      difficulty: string;
      level: number;
      connections: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
      confidence: number;
    }>;
  }> {
    try {
      const { depth = 3, relationTypes = [], minStrength = 0.1 } = options;

      // 获取知识点
      const knowledgePoints = await KnowledgePoint.find({
        knowledgeBaseId,
        status: 'published'
      }).select('_id title category difficulty level').lean();

      // 获取关系
      const relationQuery: any = {
        $or: [
          { sourceId: { $in: knowledgePoints.map(kp => kp._id.toString()) } },
          { targetId: { $in: knowledgePoints.map(kp => kp._id.toString()) } }
        ],
        strength: { $gte: minStrength }
      };

      if (relationTypes.length > 0) {
        relationQuery.relationType = { $in: relationTypes };
      }

      const relations = await KnowledgeRelation.find(relationQuery).lean();

      // 计算连接数
      const connectionCounts = new Map<string, number>();
      relations.forEach(relation => {
        const sourceId = relation.sourceId;
        const targetId = relation.targetId;
        connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
        connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
      });

      // 构建图结构
      const nodes = knowledgePoints.map(kp => ({
        id: kp._id.toString(),
        title: kp.title,
        category: kp.category,
        difficulty: kp.difficulty,
        level: kp.level,
        connections: connectionCounts.get(kp._id.toString()) || 0
      }));

      const edges = relations.map(relation => ({
        source: relation.sourceId,
        target: relation.targetId,
        type: relation.relationType,
        strength: relation.strength,
        confidence: relation.confidence
      }));

      return { nodes, edges };
    } catch (error) {
      console.error('获取知识图谱失败:', error);
      throw error;
    }
  }

  // 智能推荐相关知识点
  async getRecommendations(knowledgePointId: string, options: {
    count?: number;
    types?: string[];
    userId?: string;
  } = {}): Promise<Array<{
    knowledgePoint: IKnowledgePoint;
    reason: string;
    score: number;
  }>> {
    try {
      const { count = 5, types = ['related', 'similar', 'prerequisite'], userId } = options;

      const currentKnowledgePoint = await KnowledgePoint.findById(knowledgePointId).lean();
      if (!currentKnowledgePoint) {
        throw new Error('知识点不存在');
      }

      // 基于关系的推荐
      const relationRecommendations = await this.getRelationBasedRecommendations(
        knowledgePointId, 
        types, 
        count
      );

      // 基于内容相似性的推荐
      const contentRecommendations = await this.getContentBasedRecommendations(
        currentKnowledgePoint,
        count
      );

      // 基于用户行为的推荐（如果提供了用户ID）
      let behaviorRecommendations: any[] = [];
      if (userId) {
        behaviorRecommendations = await this.getBehaviorBasedRecommendations(
          userId,
          knowledgePointId,
          count
        );
      }

      // 合并并排序推荐结果
      const allRecommendations = [
        ...relationRecommendations,
        ...contentRecommendations,
        ...behaviorRecommendations
      ];

      // 去重并按分数排序
      const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);
      uniqueRecommendations.sort((a, b) => b.score - a.score);

      return uniqueRecommendations.slice(0, count);
    } catch (error) {
      console.error('获取智能推荐失败:', error);
      throw error;
    }
  }

  // 生成搜索关键词
  private generateSearchKeywords(title: string, content: string, tags: string[]): string[] {
    const keywords = new Set<string>();

    // 从标题提取关键词
    const titleWords = title.split(/\s+/).filter(word => word.length > 1);
    titleWords.forEach(word => keywords.add(word.toLowerCase()));

    // 从内容提取关键词（简化版，实际项目中可使用NLP库）
    const contentWords = content.split(/[，。！？；：\s]+/).filter(word => word.length > 1);
    contentWords.slice(0, 10).forEach(word => keywords.add(word.toLowerCase()));

    // 添加标签
    tags.forEach(tag => keywords.add(tag.toLowerCase()));

    return Array.from(keywords);
  }

  // 计算内容完整性
  private calculateCompleteness(data: Partial<IKnowledgePoint>): number {
    let score = 0;
    const maxScore = 100;

    // 基础内容检查
    if (data.title && data.title.length > 0) score += 10;
    if (data.content && data.content.length > 100) score += 20;
    if (data.summary && data.summary.length > 0) score += 10;

    // 结构化内容检查
    if (data.sections && data.sections.length > 0) score += 15;
    if (data.mediaFiles && data.mediaFiles.length > 0) score += 10;
    if (data.exercises && data.exercises.length > 0) score += 15;

    // 元数据检查
    if (data.tags && data.tags.length > 0) score += 5;
    if (data.objectives && data.objectives.length > 0) score += 10;
    if (data.prerequisites && data.prerequisites.length >= 0) score += 5;

    return Math.min(score, maxScore);
  }

  // 检查写入权限
  private hasWritePermission(knowledgePoint: IKnowledgePoint, userId: string): boolean {
    return knowledgePoint.permissions.write.includes(userId) ||
           knowledgePoint.permissions.admin.includes(userId) ||
           knowledgePoint.metadata.authorId === userId;
  }

  // 更新知识库统计
  private async updateKnowledgeBaseStats(knowledgeBaseId: string): Promise<void> {
    try {
      const stats = await KnowledgePoint.aggregate([
        { $match: { knowledgeBaseId } },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: 1 },
            byDifficulty: {
              $push: '$difficulty'
            },
            byStatus: {
              $push: '$status'
            }
          }
        }
      ]);

      if (stats.length > 0) {
        // 这里可以更新知识库的统计信息
        console.log(`知识库 ${knowledgeBaseId} 统计更新:`, stats[0]);
      }
    } catch (error) {
      console.error('更新知识库统计失败:', error);
    }
  }

  // 计算搜索分面
  private async calculateSearchFacets(baseQuery: any): Promise<any> {
    try {
      const facets = await KnowledgePoint.aggregate([
        { $match: baseQuery },
        {
          $facet: {
            categories: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            difficulties: [
              { $group: { _id: '$difficulty', count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            statuses: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            tags: [
              { $unwind: '$tags' },
              { $group: { _id: '$tags', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 }
            ]
          }
        }
      ]);

      return facets[0] || {};
    } catch (error) {
      console.error('计算搜索分面失败:', error);
      return {};
    }
  }

  // 基于关系的推荐
  private async getRelationBasedRecommendations(
    knowledgePointId: string,
    types: string[],
    count: number
  ): Promise<any[]> {
    try {
      const relations = await KnowledgeRelation.find({
        $or: [
          { sourceId: knowledgePointId, relationType: { $in: types } },
          { targetId: knowledgePointId, relationType: { $in: types } }
        ]
      }).sort({ strength: -1 }).limit(count * 2).lean();

      const relatedIds = relations.map(r => 
        r.sourceId === knowledgePointId ? r.targetId : r.sourceId
      );

      if (relatedIds.length === 0) return [];

      const relatedKnowledgePoints = await KnowledgePoint.find({
        _id: { $in: relatedIds },
        status: 'published'
      }).lean();

      return relatedKnowledgePoints.map(kp => ({
        knowledgePoint: kp,
        reason: '基于知识关系推荐',
        score: 0.8
      }));
    } catch (error) {
      console.error('基于关系的推荐失败:', error);
      return [];
    }
  }

  // 基于内容相似性的推荐
  private async getContentBasedRecommendations(
    currentKnowledgePoint: IKnowledgePoint,
    count: number
  ): Promise<any[]> {
    try {
      // 简化版内容相似性计算
      const similarKnowledgePoints = await KnowledgePoint.find({
        _id: { $ne: currentKnowledgePoint._id },
        knowledgeBaseId: currentKnowledgePoint.knowledgeBaseId,
        category: currentKnowledgePoint.category,
        difficulty: currentKnowledgePoint.difficulty,
        status: 'published'
      }).limit(count).lean();

      return similarKnowledgePoints.map(kp => ({
        knowledgePoint: kp,
        reason: '基于内容相似性推荐',
        score: 0.6
      }));
    } catch (error) {
      console.error('基于内容相似性的推荐失败:', error);
      return [];
    }
  }

  // 基于用户行为的推荐
  private async getBehaviorBasedRecommendations(
    userId: string,
    currentKnowledgePointId: string,
    count: number
  ): Promise<any[]> {
    try {
      // 这里可以基于用户的学习历史、收藏等行为进行推荐
      // 简化版实现
      return [];
    } catch (error) {
      console.error('基于用户行为的推荐失败:', error);
      return [];
    }
  }

  // 去重推荐结果
  private deduplicateRecommendations(recommendations: any[]): any[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      const id = rec.knowledgePoint._id.toString();
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  // 获取协作会话信息
  getCollaborationSessions(knowledgePointId: string): CollaborationSession[] {
    return this.collaborationSessions.get(knowledgePointId) || [];
  }

  // 清理过期的协作会话
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredThreshold = 30 * 60 * 1000; // 30 分钟

    this.collaborationSessions.forEach((sessions, knowledgePointId) => {
      const activeSessions = sessions.filter(session => 
        (now.getTime() - session.lastActivity.getTime()) < expiredThreshold
      );

      if (activeSessions.length > 0) {
        this.collaborationSessions.set(knowledgePointId, activeSessions);
      } else {
        this.collaborationSessions.delete(knowledgePointId);
      }
    });
  }
}

export default new KnowledgeService(); 