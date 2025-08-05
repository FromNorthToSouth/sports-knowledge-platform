# AI智能题目生成 - 阿里云千问模型集成

本系统集成了阿里云千问模型（Qwen），用于智能生成体育知识题目。

## 配置说明

### 环境变量设置

在 `backend/.env` 文件中配置以下环境变量：

```env
# 阿里云千问模型API配置
DASHSCOPE_API_KEY=your_dashscope_api_key_here
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen3-235b-a22b-instruct-2507
```

### 获取API密钥

1. 访问 [阿里云DashScope控制台](https://dashscope.console.aliyun.com/)
2. 登录阿里云账号
3. 开通DashScope服务
4. 在API密钥管理页面创建新的API密钥
5. 将API密钥复制到环境变量中

## API功能说明

### 1. 单题目生成

**接口地址：** `POST /api/questions/generate`

**权限要求：** 教师及以上权限

**请求参数：**
```json
{
  "sport": "足球",
  "knowledgePoint": "越位规则",
  "difficulty": "medium",
  "type": "single_choice",
  "context": "2022年世界杯比赛情况"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "AI题目生成成功",
  "data": {
    "question": {
      "id": "...",
      "title": "足球越位规则判断",
      "content": "在足球比赛中，以下哪种情况属于越位？",
      "options": [...],
      "explanation": "...",
      "isAIGenerated": true
    }
  }
}
```

### 2. 批量题目生成

**接口地址：** `POST /api/questions/generate/batch`

**权限要求：** 内容管理员及以上权限

**请求参数：**
```json
{
  "sport": "篮球",
  "knowledgePoint": "规则判罚",
  "difficulty": "hard",
  "type": "multiple_choice",
  "count": 10,
  "context": "NBA比赛规则"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "成功生成 10 道题目",
  "data": {
    "questions": [...],
    "generated": 10,
    "saved": 10,
    "errors": []
  }
}
```

## 支持的参数

### 运动项目 (sport)
- 足球
- 篮球
- 排球
- 乒乓球
- 羽毛球
- 田径
- 游泳
- 体操
- 武术
- 其他

### 知识点类型 (knowledgePoint)
- 规则判罚
- 技术动作
- 战术配合
- 历史发展
- 著名人物
- 比赛制度
- 安全知识
- 裁判手势
- 器材装备
- 训练方法

### 难度等级 (difficulty)
- `easy`: 简单 - 适合初学者
- `medium`: 中等 - 适合有一定基础的学生
- `hard`: 困难 - 适合高水平学生

### 题目类型 (type)
- `single_choice`: 单选题
- `multiple_choice`: 多选题
- `true_false`: 判断题
- `case_analysis`: 案例分析题
- `fill_blank`: 填空题

## AI服务特性

### 1. 智能提示词优化
- 针对体育教育领域优化的提示词模板
- 支持中文语境下的专业体育术语
- 自动生成符合教学要求的题目

### 2. 质量保证机制
- 自动验证题目数据结构完整性
- 确保每道题目至少包含一个正确答案
- 对选项合理性进行基本检查

### 3. 错误处理
- 详细的错误信息反馈
- 自动重试机制（在合理范围内）
- 批量生成时的容错处理

### 4. 性能优化
- 60秒超时设置
- 批量生成时的频率控制
- 异步处理大量请求

## 使用建议

### 1. 题目质量优化
- 提供具体的知识点描述
- 添加背景信息以提高题目针对性
- 根据学生水平选择合适的难度

### 2. 批量生成策略
- 单次批量生成不超过20道题目
- 对生成的题目进行人工审核
- 根据实际需要调整生成参数

### 3. 成本控制
- 合理使用批量生成功能
- 避免重复生成相同类型题目
- 定期评估API使用情况

## 故障排除

### 常见错误及解决方案

1. **API密钥错误**
   - 检查环境变量配置
   - 确认API密钥有效性
   - 验证账户余额充足

2. **网络连接问题**
   - 检查服务器网络连接
   - 确认防火墙设置
   - 验证API端点可访问性

3. **生成内容格式错误**
   - 通常由模型响应异常导致
   - 系统会自动重试
   - 如持续出现请检查提示词配置

4. **权限不足**
   - 确认用户角色权限
   - 检查路由权限配置
   - 验证JWT令牌有效性

## 监控和日志

系统会记录以下AI相关日志：
- API调用成功/失败记录
- 生成题目的质量评估
- 用户使用频率统计
- 错误发生情况追踪

建议定期查看日志以优化AI服务使用效果。 