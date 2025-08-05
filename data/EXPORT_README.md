# 📤 数据导出工具使用指南

## 📋 概述

`data_exporter.py` 是体育知识智能题库平台的数据导出工具，用于将MongoDB数据库中的数据导出为JSON文件。

## 🚀 快速开始

### 基本使用

```bash
# 导出所有数据到默认目录 ./export
python data_exporter.py

# 指定输出目录
python data_exporter.py --output ./backup

# 只导出特定集合
python data_exporter.py --collections users questions exams
```

## 🛠️ 命令行选项

| 选项 | 简写 | 描述 | 默认值 |
|------|------|------|---------|
| `--output` | `-o` | 输出目录 | `./export` |
| `--collections` | `-c` | 指定要导出的集合 | 全部集合 |
| `--connection` | | MongoDB连接字符串 | `mongodb://localhost:27017` |
| `--database` | | 数据库名称 | `sports_platform` |
| `--no-stats` | | 不显示统计信息 | 显示统计 |

## 📊 支持的集合

| 集合标识 | 集合名称 | 输出文件名 | 描述 |
|----------|----------|------------|------|
| `institutions` | institutions | institutions_export.json | 机构数据 |
| `users` | users | users_export.json | 用户数据 |
| `knowledgebases` | knowledgebases | knowledge_bases_export.json | 知识库数据 |
| `knowledgepoints` | knowledgepoints | knowledge_points_export.json | 知识点数据 |
| `learningpaths` | learningpaths | learning_paths_export.json | 学习路径数据 |
| `questions` | questions | questions_export.json | 题目数据 |
| `exams` | exams | exams_export.json | 考试记录数据 |
| `knowledgeprogresses` | knowledgeprogresses | knowledge_progress_export.json | 学习进度数据 |

## 💡 使用示例

### 1. 导出所有数据

```bash
python data_exporter.py
```

**输出:**
```
======================================================================
体育知识智能题库平台 - 数据导出工具
======================================================================
开始时间: 2024-01-31 15:30:00
正在连接数据库: mongodb://localhost:27017
✓ 数据库连接成功：sports_platform

==================================================
数据库统计信息
==================================================
  - 机构数据: 4 条记录
  - 用户数据: 8 条记录
  - 知识库数据: 5 条记录
  ...

✓ 数据导出完成！
```

### 2. 导出到指定目录

```bash
python data_exporter.py --output ./data_backup_2024
```

### 3. 只导出用户和题目数据

```bash
python data_exporter.py --collections users questions
```

### 4. 连接远程数据库

```bash
python data_exporter.py --connection "mongodb://username:password@remote-host:27017" --database "prod_sports_platform"
```

### 5. 不显示统计信息（适合脚本调用）

```bash
python data_exporter.py --no-stats --output ./backup
```

## 📁 输出结构

导出完成后，输出目录将包含：

```
export/
├── institutions_export.json        # 机构数据
├── users_export.json              # 用户数据
├── knowledge_bases_export.json    # 知识库数据
├── knowledge_points_export.json   # 知识点数据
├── learning_paths_export.json     # 学习路径数据
├── questions_export.json          # 题目数据
├── exams_export.json             # 考试记录数据
├── knowledge_progress_export.json # 学习进度数据
└── export_report.json            # 导出报告
```

## 📊 导出报告

每次导出都会生成一个详细的报告文件 `export_report.json`：

```json
{
  "export_time": "2024-01-31 15:30:00",
  "database_name": "sports_platform",
  "connection_string": "mongodb://localhost:27017",
  "collections": {
    "users": {
      "collection_name": "users",
      "description": "用户数据",
      "filename": "users_export.json",
      "total_documents": 8,
      "exported_documents": 8,
      "errors": 0,
      "success": true
    }
  }
}
```

## 🔧 数据格式

### ObjectId 处理

导出的JSON文件中，所有MongoDB的ObjectId都会自动转换为字符串格式：

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "北京体育大学",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 嵌套对象

复杂的嵌套对象结构会完整保留：

```json
{
  "_id": "507f1f77bcf86cd799439301",
  "username": "student_wang",
  "learningStats": {
    "totalQuestions": 156,
    "correctAnswers": 124,
    "accuracy": 79.49
  }
}
```

## 🚨 注意事项

1. **磁盘空间**: 确保输出目录有足够的磁盘空间
2. **权限**: 确保对输出目录有写入权限
3. **数据库连接**: 确保数据库服务正在运行且可访问
4. **大数据集**: 对于大型数据集，导出过程可能需要较长时间

## 🔍 故障排除

### 常见错误

**1. 数据库连接失败**
```
❌ 数据库连接失败: [Errno 111] Connection refused
```
**解决方案**: 检查MongoDB服务是否运行，连接字符串是否正确

**2. 权限错误**
```
❌ 导出失败: [Errno 13] Permission denied
```
**解决方案**: 检查输出目录权限，或使用管理员权限运行

**3. 集合不存在**
```
⚠️  集合 users 为空，跳过导出
```
**解决方案**: 确认数据库中存在相应的集合和数据

## 🔄 与导入工具配合使用

导出的JSON文件可以直接用于 `data_seeder.py` 导入工具：

```bash
# 导出数据
python data_exporter.py --output ./backup

# 将导出的文件重命名为导入工具期望的格式
mv backup/users_export.json users.json
mv backup/questions_export.json questions.json

# 使用导入工具
python data_seeder.py
```

## 🤝 技术支持

如有问题或建议，请联系开发团队或查看项目文档。

---

**📝 最后更新**: 2024-01-31  
**🔧 版本**: 1.0.0 