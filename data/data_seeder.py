#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
体育知识智能题库平台 - 数据初始化脚本
用于导入所有初始化数据和样例数据到MongoDB数据库
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any
import traceback

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, DuplicateKeyError
    from dotenv import load_dotenv
    from colorama import Fore, Style, init
    from tqdm import tqdm
except ImportError as e:
    print(f"缺少必要的Python包，请运行：pip install -r requirements.txt")
    print(f"错误详情：{e}")
    sys.exit(1)

# 初始化colorama（Windows系统彩色输出支持）
init(autoreset=True)

class DatabaseSeeder:
    """数据库种子数据导入器"""
    
    def __init__(self, mongo_uri: str = None, database_name: str = None):
        """
        初始化数据库连接
        
        Args:
            mongo_uri: MongoDB连接字符串
            database_name: 数据库名称
        """
        # 加载环境变量
        load_dotenv()
        
        # 设置数据库连接参数
        self.mongo_uri = mongo_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        self.database_name = database_name or os.getenv('DATABASE_NAME', 'sports_knowledge_platform')
        
        # 数据文件配置
        self.data_files = {
            'institutions': {
                'file': 'institutions.json',
                'collection': 'institutions',
                'description': '机构数据'
            },
            'users': {
                'file': 'users.json',
                'collection': 'users',
                'description': '用户数据'
            },
            'knowledge_bases': {
                'file': 'knowledge_bases.json',
                'collection': 'knowledgebases',
                'description': '知识库数据'
            },
            'knowledge_points': {
                'file': 'knowledge_points.json',
                'collection': 'knowledgepoints',
                'description': '知识点数据'
            },
            'learning_paths': {
                'file': 'learning_paths.json',
                'collection': 'learningpaths',
                'description': '学习路径数据'
            },
            'questions': {
                'file': 'questions.json',
                'collection': 'questions',
                'description': '题目数据'
            },
            'exams': {
                'file': 'exams.json',
                'collection': 'exams',
                'description': '考试记录数据'
            },
            'knowledge_progress': {
                'file': 'knowledge_progress.json',
                'collection': 'knowledgeprogresses',
                'description': '学习进度数据'
            },
            'additional_students': {
                'file': 'additional_students.json',
                'collection': 'users',
                'description': '额外学生用户数据'
            },
            'classes': {
                'file': 'classes.json',
                'collection': 'classes',
                'description': '班级数据'
            }
        }
        
        self.client = None
        self.db = None
        
    def connect(self) -> bool:
        """
        连接到MongoDB数据库
        
        Returns:
            bool: 连接是否成功
        """
        try:
            print(f"{Fore.YELLOW}正在连接数据库: {self.mongo_uri}")
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            
            # 测试连接
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            
            print(f"{Fore.GREEN}✓ 数据库连接成功：{self.database_name}")
            return True
            
        except ConnectionFailure as e:
            print(f"{Fore.RED}✗ 数据库连接失败：{e}")
            return False
        except Exception as e:
            print(f"{Fore.RED}✗ 数据库连接错误：{e}")
            return False
    
    def load_json_data(self, file_path: str) -> List[Dict[str, Any]]:
        """
        加载JSON数据文件
        
        Args:
            file_path: JSON文件路径
            
        Returns:
            List[Dict[str, Any]]: 加载的数据列表
        """
        try:
            if not os.path.exists(file_path):
                print(f"{Fore.RED}✗ 文件不存在：{file_path}")
                return []
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if not isinstance(data, list):
                print(f"{Fore.RED}✗ 数据格式错误，期望列表格式：{file_path}")
                return []
                
            return data
            
        except json.JSONDecodeError as e:
            print(f"{Fore.RED}✗ JSON格式错误 {file_path}：{e}")
            return []
        except Exception as e:
            print(f"{Fore.RED}✗ 文件读取错误 {file_path}：{e}")
            return []
    
    def convert_object_ids(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        转换字符串ID为MongoDB ObjectId
        
        Args:
            data: 原始数据列表
            
        Returns:
            List[Dict[str, Any]]: 转换后的数据列表
        """
        from bson import ObjectId
        
        def convert_item(item):
            if isinstance(item, dict):
                result = {}
                for key, value in item.items():
                    if key == '_id' and isinstance(value, str) and len(value) == 24:
                        try:
                            result[key] = ObjectId(value)
                        except:
                            result[key] = value
                    elif isinstance(value, str) and len(value) == 24 and (
                        'Id' in key or key in ['author', 'creator', 'createdBy', 'reviewedBy', 'institution', 'knowledgeBase', 'pointId']
                    ):
                        try:
                            result[key] = ObjectId(value)
                        except:
                            result[key] = value
                    elif isinstance(value, list):
                        result[key] = [convert_item(v) for v in value]
                    elif isinstance(value, dict):
                        result[key] = convert_item(value)
                    else:
                        result[key] = value
                return result
            elif isinstance(item, list):
                return [convert_item(v) for v in item]
            else:
                return item
        
        return [convert_item(item) for item in data]
    
    def import_data(self, data_key: str, force_update: bool = False) -> bool:
        """
        导入单个数据文件
        
        Args:
            data_key: 数据类型键名
            force_update: 是否强制更新已存在的数据
            
        Returns:
            bool: 导入是否成功
        """
        if data_key not in self.data_files:
            print(f"{Fore.RED}✗ 未知的数据类型：{data_key}")
            return False
            
        config = self.data_files[data_key]
        file_path = config['file']
        collection_name = config['collection']
        description = config['description']
        
        print(f"\n{Fore.CYAN}{'='*50}")
        print(f"{Fore.CYAN}开始导入 {description}")
        print(f"{Fore.CYAN}{'='*50}")
        
        # 加载数据
        data = self.load_json_data(file_path)
        if not data:
            print(f"{Fore.RED}✗ 没有数据可导入")
            return False
            
        # 转换ObjectId
        data = self.convert_object_ids(data)
        
        # 获取集合
        collection = self.db[collection_name]
        
        success_count = 0
        error_count = 0
        
        # 使用进度条显示导入进度
        with tqdm(total=len(data), desc=f"导入{description}", 
                 bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]") as pbar:
            
            for item in data:
                try:
                    # 检查是否已存在
                    existing = collection.find_one({'_id': item['_id']})
                    
                    if existing:
                        if force_update:
                            # 更新现有记录
                            result = collection.replace_one({'_id': item['_id']}, item)
                            if result.modified_count > 0:
                                success_count += 1
                                pbar.set_postfix(status="更新", color="yellow")
                            else:
                                pbar.set_postfix(status="无变化", color="blue")
                        else:
                            pbar.set_postfix(status="已存在", color="blue")
                    else:
                        # 插入新记录
                        collection.insert_one(item)
                        success_count += 1
                        pbar.set_postfix(status="新增", color="green")
                        
                except DuplicateKeyError:
                    error_count += 1
                    pbar.set_postfix(status="重复", color="red")
                except Exception as e:
                    error_count += 1
                    pbar.set_postfix(status="错误", color="red")
                    print(f"\n{Fore.RED}✗ 导入项目失败：{e}")
                    
                pbar.update(1)
        
        # 显示导入结果
        print(f"\n{Fore.GREEN}✓ {description} 导入完成")
        print(f"  - 成功: {success_count} 条")
        if error_count > 0:
            print(f"  - 失败: {error_count} 条")
            
        return error_count == 0
    
    def create_indexes(self):
        """创建数据库索引以提高查询性能"""
        print(f"\n{Fore.CYAN}{'='*50}")
        print(f"{Fore.CYAN}创建数据库索引")
        print(f"{Fore.CYAN}{'='*50}")
        
        try:
            # 用户集合索引
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("username", unique=True)
            self.db.users.create_index("institution")
            
            # 机构集合索引
            self.db.institutions.create_index("name", unique=True)
            self.db.institutions.create_index([("type", 1), ("status", 1)])
            
            # 知识库集合索引
            self.db.knowledgebases.create_index([("author", 1), ("status", 1)])
            self.db.knowledgebases.create_index([("category", 1), ("level", 1), ("isPublic", 1)])
            
            # 知识点集合索引
            self.db.knowledgepoints.create_index("knowledgeBaseId")
            self.db.knowledgepoints.create_index([("category", 1), ("difficulty", 1)])
            
            # 学习路径集合索引
            self.db.learningpaths.create_index("knowledgeBase")
            self.db.learningpaths.create_index([("difficulty", 1), ("status", 1)])
            
            # 题目集合索引
            self.db.questions.create_index([("category.sport", 1)])
            self.db.questions.create_index([("category.knowledgeType", 1)])
            self.db.questions.create_index([("difficulty", 1), ("status", 1)])
            
            # 考试记录集合索引
            self.db.exams.create_index("user")
            self.db.exams.create_index([("status", 1), ("completedAt", -1)])
            self.db.exams.create_index([("examType", 1), ("createdAt", -1)])
            
            # 学习进度集合索引
            self.db.knowledgeprogresses.create_index([("user", 1), ("knowledgeBase", 1)])
            self.db.knowledgeprogresses.create_index([("user", 1), ("status", 1), ("updatedAt", -1)])
            self.db.knowledgeprogresses.create_index([("knowledgeBase", 1), ("status", 1)])
            
            # 班级集合索引
            self.db.classes.create_index([("teacherId", 1), ("status", 1)])
            self.db.classes.create_index([("institutionId", 1), ("grade", 1)])
            self.db.classes.create_index("name")
            self.db.classes.create_index("students.userId")
            
            print(f"{Fore.GREEN}✓ 数据库索引创建完成")
            
        except Exception as e:
            print(f"{Fore.RED}✗ 索引创建失败：{e}")
    
    def verify_data(self) -> bool:
        """验证导入的数据完整性"""
        print(f"\n{Fore.CYAN}{'='*50}")
        print(f"{Fore.CYAN}验证数据完整性")
        print(f"{Fore.CYAN}{'='*50}")
        
        try:
            verification_results = {}
            
            for data_key, config in self.data_files.items():
                collection_name = config['collection']
                description = config['description']
                
                count = self.db[collection_name].count_documents({})
                verification_results[description] = count
                
                print(f"  - {description}: {count} 条记录")
            
            # 验证关联关系
            print(f"\n{Fore.YELLOW}验证数据关联关系:")
            
            # 验证用户-机构关联
            users_count = self.db.users.count_documents({})
            institutions_count = self.db.institutions.count_documents({})
            print(f"  - 用户总数: {users_count}")
            print(f"  - 机构总数: {institutions_count}")
            
            # 验证知识库-知识点关联
            kb_count = self.db.knowledgebases.count_documents({})
            kp_count = self.db.knowledgepoints.count_documents({})
            print(f"  - 知识库总数: {kb_count}")
            print(f"  - 知识点总数: {kp_count}")
            
            print(f"\n{Fore.GREEN}✓ 数据验证完成")
            return True
            
        except Exception as e:
            print(f"{Fore.RED}✗ 数据验证失败：{e}")
            return False
    
    def cleanup_data(self, confirm: bool = False):
        """清理所有数据（谨慎使用）"""
        if not confirm:
            response = input(f"\n{Fore.YELLOW}⚠️  确定要清理所有数据吗？这将删除数据库中的所有集合！(y/N): ")
            if response.lower() != 'y':
                print(f"{Fore.BLUE}取消清理操作")
                return
        
        print(f"\n{Fore.RED}开始清理数据...")
        
        try:
            for config in self.data_files.values():
                collection_name = config['collection']
                result = self.db[collection_name].delete_many({})
                print(f"  - 清理 {config['description']}: {result.deleted_count} 条记录")
            
            print(f"{Fore.GREEN}✓ 数据清理完成")
            
        except Exception as e:
            print(f"{Fore.RED}✗ 数据清理失败：{e}")
    
    def run(self, force_update: bool = False, cleanup_first: bool = False):
        """
        运行完整的数据导入流程
        
        Args:
            force_update: 是否强制更新已存在的数据
            cleanup_first: 是否先清理现有数据
        """
        print(f"{Fore.MAGENTA}{'='*70}")
        print(f"{Fore.MAGENTA}体育知识智能题库平台 - 数据初始化")
        print(f"{Fore.MAGENTA}{'='*70}")
        print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 连接数据库
        if not self.connect():
            return False
        
        try:
            # 可选：先清理数据
            if cleanup_first:
                self.cleanup_data()
            
            # 按顺序导入数据（考虑外键依赖关系）
            import_order = [
                'institutions',     # 首先导入机构
                'users',           # 然后导入用户（依赖机构）
                'additional_students', # 导入额外学生用户（依赖机构）
                'classes',         # 导入班级（依赖用户和机构）
                'knowledge_bases', # 导入知识库（依赖用户）
                'knowledge_points',# 导入知识点（依赖知识库）
                'learning_paths',  # 导入学习路径（依赖知识库和知识点）
                'questions',       # 导入题目
                'exams',          # 导入考试记录（依赖用户和题目）
                'knowledge_progress' # 导入学习进度（依赖用户、知识库、知识点、学习路径）
            ]
            
            success_count = 0
            for data_key in import_order:
                if self.import_data(data_key, force_update):
                    success_count += 1
            
            # 创建索引
            self.create_indexes()
            
            # 验证数据
            self.verify_data()
            
            print(f"\n{Fore.MAGENTA}{'='*70}")
            print(f"{Fore.GREEN}✓ 数据导入完成！")
            print(f"  - 成功导入: {success_count}/{len(import_order)} 类数据")
            print(f"  - 完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{Fore.MAGENTA}{'='*70}")
            
            return True
            
        except Exception as e:
            print(f"\n{Fore.RED}✗ 数据导入过程中发生错误：{e}")
            print(f"{Fore.RED}错误详情：")
            traceback.print_exc()
            return False
        
        finally:
            if self.client:
                self.client.close()


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='体育知识智能题库平台数据初始化工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python data_seeder.py                    # 标准导入
  python data_seeder.py --force            # 强制更新现有数据
  python data_seeder.py --cleanup          # 清理后重新导入
  python data_seeder.py --mongo-uri mongodb://user:pass@host:port/db --database mydb
        """
    )
    
    parser.add_argument('--mongo-uri', default='mongodb://localhost:27017',
                       help='MongoDB连接字符串 (默认: mongodb://localhost:27017)')
    parser.add_argument('--database', default='sports_knowledge_platform',
                        help='数据库名称 (默认: sports_knowledge_platform)')
    parser.add_argument('--force', action='store_true',
                       help='强制更新已存在的数据')
    parser.add_argument('--cleanup', action='store_true',
                       help='导入前先清理现有数据')
    parser.add_argument('--verify-only', action='store_true',
                       help='仅验证数据，不执行导入')
    
    args = parser.parse_args()
    
    # 创建数据导入器
    seeder = DatabaseSeeder(args.mongo_uri, args.database)
    
    if args.verify_only:
        # 仅验证模式
        if seeder.connect():
            seeder.verify_data()
    else:
        # 完整导入模式
        success = seeder.run(
            force_update=args.force,
            cleanup_first=args.cleanup
        )
        
        if success:
            print(f"\n{Fore.GREEN}🎉 恭喜！数据导入成功完成。")
            print(f"{Fore.GREEN}现在可以启动应用程序并使用以下测试账户：")
            print(f"\n{Fore.YELLOW}超级管理员:")
            print(f"  用户名: superadmin")
            print(f"  密码: admin123456")
            print(f"\n{Fore.YELLOW}机构管理员:")
            print(f"  用户名: bsu_admin")
            print(f"  密码: admin123456")
            print(f"\n{Fore.YELLOW}教师账户:")
            print(f"  用户名: teacher_zhang")
            print(f"  密码: admin123456")
            print(f"\n{Fore.YELLOW}学生账户:")
            print(f"  用户名: student_wang")
            print(f"  密码: admin123456")
            
            sys.exit(0)
        else:
            print(f"\n{Fore.RED}❌ 数据导入失败，请检查错误信息。")
            sys.exit(1)


if __name__ == '__main__':
    main() 