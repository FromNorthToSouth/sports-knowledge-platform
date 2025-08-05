#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import argparse
from datetime import datetime
from typing import Dict, List, Any, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from bson import ObjectId
from colorama import init, Fore, Style
from tqdm import tqdm
import sys

# 初始化colorama
init(autoreset=True)

class DatabaseExporter:
    def __init__(self, 
                 connection_string: str = "mongodb://localhost:27017",
                 database_name: str = "sports_knowledge_platform"):
        """
        初始化数据库导出器
        
        Args:
            connection_string: MongoDB连接字符串
            database_name: 数据库名称
        """
        self.connection_string = connection_string
        self.database_name = database_name
        self.client: Optional[MongoClient] = None
        self.db = None
        
        # 集合配置
        self.collections_config = {
            'institutions': {
                'collection': 'institutions',
                'filename': 'institutions_export.json',
                'description': '机构数据'
            },
            'users': {
                'collection': 'users',
                'filename': 'users_export.json',
                'description': '用户数据'
            },
            'knowledgebases': {
                'collection': 'knowledgebases',
                'filename': 'knowledge_bases_export.json',
                'description': '知识库数据'
            },
            'knowledgepoints': {
                'collection': 'knowledgepoints',
                'filename': 'knowledge_points_export.json',
                'description': '知识点数据'
            },
            'learningpaths': {
                'collection': 'learningpaths',
                'filename': 'learning_paths_export.json',
                'description': '学习路径数据'
            },
            'questions': {
                'collection': 'questions',
                'filename': 'questions_export.json',
                'description': '题目数据'
            },
            'exams': {
                'collection': 'exams',
                'filename': 'exams_export.json',
                'description': '考试记录数据'
            },
            'knowledgeprogresses': {
                'collection': 'knowledgeprogresses',
                'filename': 'knowledge_progress_export.json',
                'description': '学习进度数据'
            }
        }
    
    def connect(self) -> bool:
        """连接到MongoDB数据库"""
        try:
            print(f"{Fore.YELLOW}正在连接数据库: {self.connection_string}")
            self.client = MongoClient(self.connection_string)
            
            # 测试连接
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            
            print(f"{Fore.GREEN}✓ 数据库连接成功：{self.database_name}")
            return True
            
        except Exception as e:
            print(f"{Fore.RED}❌ 数据库连接失败: {str(e)}")
            return False
    
    def disconnect(self):
        """断开数据库连接"""
        if self.client:
            self.client.close()
            print(f"{Fore.BLUE}🔌 数据库连接已关闭")
    
    def convert_objectid_to_string(self, obj: Any) -> Any:
        """递归转换ObjectId为字符串"""
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, dict):
            return {k: self.convert_objectid_to_string(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_objectid_to_string(item) for item in obj]
        else:
            return obj
    
    def export_collection(self, collection_name: str, output_file: str, description: str) -> Dict[str, int]:
        """
        导出单个集合数据
        
        Args:
            collection_name: 集合名称
            output_file: 输出文件名
            description: 集合描述
            
        Returns:
            导出统计信息
        """
        try:
            collection: Collection = self.db[collection_name]
            
            # 获取文档总数
            total_count = collection.count_documents({})
            
            if total_count == 0:
                print(f"{Fore.YELLOW}⚠️  集合 {collection_name} 为空，跳过导出")
                return {'total': 0, 'exported': 0, 'errors': 0}
            
            print(f"\n{Fore.CYAN}==================================================")
            print(f"{Fore.CYAN}开始导出 {description}")
            print(f"{Fore.CYAN}==================================================")
            print(f"{Fore.BLUE}📊 集合: {collection_name}")
            print(f"{Fore.BLUE}📄 文档数量: {total_count}")
            print(f"{Fore.BLUE}💾 输出文件: {output_file}")
            
            # 获取所有文档
            documents = []
            exported_count = 0
            error_count = 0
            
            # 使用tqdm显示进度条
            with tqdm(total=total_count, desc=f"导出{description}", 
                     bar_format='{desc}: {percentage:3.0f}%|{bar}| {n}/{total_fmt}') as pbar:
                
                for doc in collection.find():
                    try:
                        # 转换ObjectId为字符串
                        converted_doc = self.convert_objectid_to_string(doc)
                        documents.append(converted_doc)
                        exported_count += 1
                        
                    except Exception as e:
                        print(f"{Fore.RED}⚠️  转换文档失败: {str(e)}")
                        error_count += 1
                    
                    pbar.update(1)
            
            # 保存到JSON文件
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(documents, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"{Fore.GREEN}✓ {description} 导出完成")
            print(f"  - 总计: {total_count} 条")
            print(f"  - 成功: {exported_count} 条")
            if error_count > 0:
                print(f"  - 错误: {error_count} 条")
            print(f"  - 文件: {output_file}")
            
            return {
                'total': total_count,
                'exported': exported_count,
                'errors': error_count
            }
            
        except Exception as e:
            print(f"{Fore.RED}❌ 导出集合 {collection_name} 失败: {str(e)}")
            return {'total': 0, 'exported': 0, 'errors': 1}
    
    def get_database_stats(self) -> Dict[str, Any]:
        """获取数据库统计信息"""
        try:
            stats = {}
            
            print(f"\n{Fore.CYAN}==================================================")
            print(f"{Fore.CYAN}数据库统计信息")
            print(f"{Fore.CYAN}==================================================")
            
            for config_key, config in self.collections_config.items():
                collection_name = config['collection']
                description = config['description']
                
                try:
                    count = self.db[collection_name].count_documents({})
                    stats[collection_name] = count
                    print(f"  - {description}: {count} 条记录")
                except Exception as e:
                    stats[collection_name] = 0
                    print(f"  - {description}: {Fore.RED}统计失败 ({str(e)})")
            
            return stats
            
        except Exception as e:
            print(f"{Fore.RED}❌ 获取数据库统计失败: {str(e)}")
            return {}
    
    def export_all_collections(self, output_dir: str = "./export", specific_collections: List[str] = None) -> bool:
        """
        导出所有或指定集合的数据
        
        Args:
            output_dir: 输出目录
            specific_collections: 指定要导出的集合列表
            
        Returns:
            是否成功
        """
        try:
            # 创建输出目录
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                print(f"{Fore.GREEN}📁 创建输出目录: {output_dir}")
            
            # 确定要导出的集合
            collections_to_export = specific_collections or list(self.collections_config.keys())
            
            print(f"{Fore.BLUE}📋 计划导出 {len(collections_to_export)} 个集合")
            
            # 导出统计
            export_stats = {}
            total_exported = 0
            total_errors = 0
            
            # 逐个导出集合
            for config_key in collections_to_export:
                if config_key not in self.collections_config:
                    print(f"{Fore.RED}❌ 未知集合: {config_key}")
                    continue
                
                config = self.collections_config[config_key]
                collection_name = config['collection']
                filename = config['filename']
                description = config['description']
                
                output_file = os.path.join(output_dir, filename)
                
                # 导出集合
                stats = self.export_collection(collection_name, output_file, description)
                export_stats[config_key] = stats
                
                total_exported += stats['exported']
                total_errors += stats['errors']
            
            # 生成导出报告
            self.generate_export_report(export_stats, output_dir)
            
            print(f"\n{Fore.CYAN}======================================================================")
            print(f"{Fore.GREEN}✓ 数据导出完成！")
            print(f"  - 导出集合: {len(collections_to_export)}")
            print(f"  - 总计记录: {total_exported}")
            if total_errors > 0:
                print(f"  - 错误数量: {total_errors}")
            print(f"  - 输出目录: {output_dir}")
            print(f"  - 完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{Fore.CYAN}======================================================================")
            
            return total_errors == 0
            
        except Exception as e:
            print(f"{Fore.RED}❌ 导出失败: {str(e)}")
            return False
    
    def generate_export_report(self, export_stats: Dict[str, Dict[str, int]], output_dir: str):
        """生成导出报告"""
        try:
            report = {
                'export_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'database_name': self.database_name,
                'connection_string': self.connection_string,
                'collections': {}
            }
            
            for config_key, stats in export_stats.items():
                config = self.collections_config[config_key]
                report['collections'][config_key] = {
                    'collection_name': config['collection'],
                    'description': config['description'],
                    'filename': config['filename'],
                    'total_documents': stats['total'],
                    'exported_documents': stats['exported'],
                    'errors': stats['errors'],
                    'success': stats['errors'] == 0
                }
            
            # 保存报告
            report_file = os.path.join(output_dir, 'export_report.json')
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            print(f"{Fore.GREEN}📊 导出报告已生成: {report_file}")
            
        except Exception as e:
            print(f"{Fore.RED}❌ 生成导出报告失败: {str(e)}")
    
    def run(self, output_dir: str = "./export", specific_collections: List[str] = None, show_stats: bool = True):
        """
        运行数据导出
        
        Args:
            output_dir: 输出目录
            specific_collections: 指定集合列表
            show_stats: 是否显示统计信息
        """
        print(f"{Fore.CYAN}======================================================================")
        print(f"{Fore.CYAN}体育知识智能题库平台 - 数据导出工具")
        print(f"{Fore.CYAN}======================================================================")
        print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 连接数据库
            if not self.connect():
                return False
            
            # 显示数据库统计
            if show_stats:
                self.get_database_stats()
            
            # 导出数据
            success = self.export_all_collections(output_dir, specific_collections)
            
            return success
            
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}⚠️  用户中断导出操作")
            return False
        except Exception as e:
            print(f"{Fore.RED}❌ 导出过程发生错误: {str(e)}")
            return False
        finally:
            self.disconnect()

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="体育知识智能题库平台 - 数据导出工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python data_exporter.py                                    # 导出所有数据
  python data_exporter.py --output ./backup                  # 指定输出目录
  python data_exporter.py --collections users questions      # 只导出用户和题目数据
  python data_exporter.py --no-stats                        # 不显示统计信息
        """
    )
    
    parser.add_argument('--output', '-o', 
                       default='./export',
                       help='输出目录 (默认: ./export)')
    
    parser.add_argument('--collections', '-c',
                       nargs='*',
                       help='指定要导出的集合 (可选: institutions, users, knowledgebases, knowledgepoints, learningpaths, questions, exams, knowledgeprogresses)')
    
    parser.add_argument('--connection', 
                       default='mongodb://localhost:27017',
                       help='MongoDB连接字符串 (默认: mongodb://localhost:27017)')
    
    parser.add_argument('--database', 
                       default='sports_knowledge_platform',
                       help='数据库名称 (默认: sports_knowledge_platform)')
    
    parser.add_argument('--no-stats',
                       action='store_true',
                       help='不显示数据库统计信息')
    
    args = parser.parse_args()
    
    # 创建导出器
    exporter = DatabaseExporter(
        connection_string=args.connection,
        database_name=args.database
    )
    
    # 执行导出
    success = exporter.run(
        output_dir=args.output,
        specific_collections=args.collections,
        show_stats=not args.no_stats
    )
    
    # 退出状态
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 