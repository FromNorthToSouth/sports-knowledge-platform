# 体育知识智能题库平台 - 数据初始化

本目录包含体育知识智能题库平台的所有初始化数据和导入工具。

## 📁 文件结构

```
data/
├── README.md                 # 本文件
├── requirements.txt          # Python依赖包
├── data_seeder.py           # 数据导入脚本（完整导入）
├── import_class_data.py     # 班级数据导入脚本（专用）
├── institutions.json        # 机构数据
├── users.json               # 用户数据
├── additional_students.json # 额外学生用户数据
├── classes.json             # 班级数据
├── knowledge_bases.json     # 知识库数据
├── knowledge_points.json    # 知识点数据
├── learning_paths.json      # 学习路径数据
├── questions.json           # 题目数据
├── exams.json               # 考试记录数据
└── knowledge_progress.json  # 学习进度数据
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd data
pip install -r requirements.txt
```

### 2. 准备数据库

确保MongoDB服务正在运行，默认连接：`mongodb://localhost:27017`

### 3. 导入数据

```bash
# 标准导入（不覆盖已存在数据）
python data_seeder.py

# 强制更新现有数据
python data_seeder.py --force

# 清理后重新导入
python data_seeder.py --cleanup

# 自定义数据库连接
python data_seeder.py --mongo-uri mongodb://user:pass@host:port --database mydb
```

### 4. 班级和学生数据导入（可选）

如果您需要演示班级管理功能，可以使用专门的班级数据导入脚本：

```bash
# 导入额外的学生用户和班级数据
python import_class_data.py
```

这个脚本将：
- 导入8名额外的学生用户
- 创建4个班级（体育教育1班、体育教育2班、运动训练1班、运动训练2班）
- 将学生分配到对应的班级中
- 验证数据完整性和关联关系

## 📊 数据内容

### 机构数据 (4个)
- 北京体育大学
- 清华大学附属中学  
- 上海市第一中学
- 飞跃体育培训中心

### 用户数据 (8个基础 + 8个扩展)
- **超级管理员**: `superadmin` / `admin123456`
- **机构管理员**: `bsu_admin`, `qhfz_admin` / `admin123456`
- **教师**: `teacher_zhang`, `teacher_li` / `admin123456`
- **学生（基础）**: `student_wang`, `student_liu`, `student_chen` / `admin123456`
- **学生（扩展）**: `student_zhang`, `student_li`, `student_wu`, `student_zhao`, `student_qian`, `student_sun`, `student_zhou`, `student_wu2` / `admin123456`

### 班级数据 (4个)
- **体育教育1班** (大一) - 任课教师: teacher_zhang - 学生: 2名
- **体育教育2班** (大二) - 任课教师: teacher_zhang - 学生: 3名
- **运动训练1班** (大一) - 任课教师: teacher_li - 学生: 3名
- **运动训练2班** (大二) - 任课教师: teacher_li - 学生: 2名

### 知识库数据 (5个)
- 足球基础技能训练
- 篮球进阶技术
- 游泳安全与技能
- 田径运动基础
- 网球技巧提升

### 知识点数据 (3个示例)
- 足球基本规则
- 颠球基础技巧
- 传球技术要点

### 学习路径数据 (3个)
- 足球基础入门路径
- 篮球技术进阶路径
- 游泳安全与技能路径

### 题目数据 (5个示例)
- 单选题：足球比赛基本规则
- 多选题：足球颠球技巧
- 判断题：足球传球判断
- 问答题：篮球投篮技术
- 填空题：游泳安全知识

### 考试记录数据 (5个)
- 足球基础知识测试记录
- 足球技术能力测试记录
- 篮球基础测试记录
- 游泳安全知识测试记录
- 体育综合知识测试记录

### 学习进度数据 (10个)
- 用户在知识点上的学习进度
- 用户在学习路径上的学习进度
- 包含学习时间、完成状态、评分等信息

## 🛠️ 命令行选项

| 选项 | 描述 |
|------|------|
| `--mongo-uri` | MongoDB连接字符串 (默认: mongodb://localhost:27017) |
| `--database` | 数据库名称 (默认: sports_platform) |
| `--force` | 强制更新已存在的数据 |
| `--cleanup` | 导入前先清理现有数据 |
| `--verify-only` | 仅验证数据，不执行导入 |

## 📈 数据导入流程

脚本会按以下顺序导入数据（考虑外键依赖关系）：

1. **机构数据** → 创建机构基础信息
2. **用户数据** → 创建不同角色的用户（依赖机构）
3. **知识库数据** → 创建知识库（依赖用户）
4. **知识点数据** → 创建知识点内容（依赖知识库）
5. **学习路径数据** → 创建学习路径（依赖知识库和知识点）
6. **题目数据** → 创建题目和练习
7. **考试记录数据** → 创建用户答题历史（依赖用户和题目）
8. **学习进度数据** → 创建用户学习进度（依赖用户、知识库、知识点、学习路径）

## 🔍 数据验证

导入完成后，脚本会自动进行以下验证：

- ✅ 检查每个集合的记录数量
- ✅ 验证数据关联关系完整性
- ✅ 创建必要的数据库索引
- ✅ 显示详细的导入报告

## 🎯 测试账户

导入成功后，可以使用以下测试账户登录系统：

### 超级管理员
- **用户名**: `superadmin`
- **密码**: `admin123456`
- **权限**: 系统全局管理

### 机构管理员  
- **用户名**: `bsu_admin`
- **密码**: `admin123456` 
- **权限**: 北京体育大学管理

### 教师账户
- **用户名**: `teacher_zhang`
- **密码**: `admin123456`
- **权限**: 知识库和题目管理

### 学生账户
- **用户名**: `student_wang`
- **密码**: `admin123456`
- **权限**: 学习和答题

## ⚠️ 注意事项

1. **数据库备份**: 在生产环境中使用前，请备份现有数据
2. **密码安全**: 测试密码仅用于开发环境，生产环境请使用强密码
3. **权限控制**: 确保数据库用户具有读写权限
4. **网络连接**: 确保能够连接到MongoDB服务器

## 🆘 故障排除

### 连接失败
```bash
# 检查MongoDB服务是否运行
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS
```

### 权限错误
```bash
# 确保MongoDB用户有足够权限
mongo --eval "db.runCommand({connectionStatus: 1})"
```

### 依赖包问题
```bash
# 重新安装依赖
pip install --upgrade -r requirements.txt
```

## 📞 技术支持

如果在数据导入过程中遇到问题，请：

1. 检查MongoDB服务状态
2. 确认网络连接正常
3. 查看详细错误信息
4. 参考故障排除指南

---

**🎉 祝您使用愉快！数据导入完成后即可开始体验体育知识智能题库平台的各项功能。** 