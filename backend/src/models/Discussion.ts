import mongoose, { Document, Schema } from 'mongoose';

export interface IReply extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  isExpertReply: boolean;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussion extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: {
    sport: string;
    type: 'question' | 'experience' | 'discussion' | 'expert_qa';
  };
  tags: string[];
  
  // 统计信息
  views: number;
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  
  // 回复
  replies: IReply[];
  replyCount: number;
  
  // 状态
  status: 'published' | 'hidden' | 'closed';
  isPinned: boolean;
  isResolved: boolean;
  
  // 专家答疑相关
  isExpertQuestion: boolean;
  expertReplied: boolean;
  expertReply?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2000 },
  isExpertReply: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

const DiscussionSchema: Schema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  category: {
    sport: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['question', 'experience', 'discussion', 'expert_qa'],
      required: true 
    }
  },
  
  tags: [{ type: String, maxlength: 20 }],
  
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  replies: [ReplySchema],
  replyCount: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['published', 'hidden', 'closed'],
    default: 'published' 
  },
  isPinned: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  
  isExpertQuestion: { type: Boolean, default: false },
  expertReplied: { type: Boolean, default: false },
  expertReply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }
}, {
  timestamps: true
});

// 索引
DiscussionSchema.index({ 'category.sport': 1 });
DiscussionSchema.index({ 'category.type': 1 });
DiscussionSchema.index({ status: 1 });
DiscussionSchema.index({ isPinned: -1, createdAt: -1 });
DiscussionSchema.index({ views: -1 });
DiscussionSchema.index({ likes: -1 });

// 更新回复数量的中间件
DiscussionSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.replyCount = this.replies.length;
  }
  next();
});

export default mongoose.model<IDiscussion>('Discussion', DiscussionSchema); 