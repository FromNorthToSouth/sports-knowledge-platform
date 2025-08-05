#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from colorama import init, Fore, Style

# 初始化colorama
init(autoreset=True)

def convert_object_ids(data):
    """递归转换字符串ID为ObjectId"""
    if isinstance(data, dict):
        converted = {}
        for key, value in data.items():
            if key == '_id' or key.endswith('Id') or key.endswith('id'):
                if isinstance(value, str) and len(value) == 24:
                    try:
                        converted[key] = ObjectId(value)
                    except:
                        converted[key] = value
                else:
                    converted[key] = value
            elif key in ['user', 'questionId', 'knowledgeBase', 'knowledgePoint', 'learningPath', 'author', 'creator', 'reviewedBy']:
                if isinstance(value, str) and len(value) == 24:
                    try:
                        converted[key] = ObjectId(value)
                    except:
                        converted[key] = value
                else:
                    converted[key] = value
            else:
                converted[key] = convert_object_ids(value)
        return converted
    elif isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    else:
        return data

def import_additional_data():
    """导入额外的学习数据"""
    try:
        print(f"{Fore.CYAN}======================================================================")
        print(f"{Fore.CYAN}体育知识智能题库平台 - 额外数据导入工具")
        print(f"{Fore.CYAN}======================================================================")
        print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 连接数据库
        client = MongoClient('mongodb://localhost:27017')
        db = client['sports_knowledge_platform']
        
        print(f"{Fore.GREEN}✓ 数据库连接成功：sports_knowledge_platform")
        
        # 导入额外的考试记录
        print(f"\n{Fore.YELLOW}==================================================")
        print(f"{Fore.YELLOW}导入额外考试记录数据")
        print(f"{Fore.YELLOW}==================================================")
        
        with open('additional_exam_data.json', 'r', encoding='utf-8') as f:
            exam_data = json.load(f)
        
        exam_data = convert_object_ids(exam_data)
        
        exam_count = 0
        for exam in exam_data:
            try:
                # 检查是否已存在
                existing = db.exams.find_one({'_id': exam['_id']})
                if not existing:
                    db.exams.insert_one(exam)
                    exam_count += 1
                    print(f"{Fore.BLUE}✓ 导入考试记录: {exam['title']}")
                else:
                    print(f"{Fore.YELLOW}⚠️  考试记录已存在: {exam['title']}")
            except Exception as e:
                print(f"{Fore.RED}❌ 导入考试记录失败: {exam.get('title', '未知')} - {str(e)}")
        
        print(f"{Fore.GREEN}✓ 额外考试记录导入完成，新增: {exam_count} 条")
        
        # 导入额外的学习进度
        print(f"\n{Fore.YELLOW}==================================================")
        print(f"{Fore.YELLOW}导入额外学习进度数据")
        print(f"{Fore.YELLOW}==================================================")
        
        with open('additional_progress_data.json', 'r', encoding='utf-8') as f:
            progress_data = json.load(f)
        
        progress_data = convert_object_ids(progress_data)
        
        progress_count = 0
        for progress in progress_data:
            try:
                # 检查是否已存在
                existing = db.knowledgeprogresses.find_one({'_id': progress['_id']})
                if not existing:
                    db.knowledgeprogresses.insert_one(progress)
                    progress_count += 1
                    print(f"{Fore.BLUE}✓ 导入学习进度: 用户{progress['user']} - 进度{progress['progress']}%")
                else:
                    print(f"{Fore.YELLOW}⚠️  学习进度已存在: {progress['_id']}")
            except Exception as e:
                print(f"{Fore.RED}❌ 导入学习进度失败: {progress.get('_id', '未知')} - {str(e)}")
        
        print(f"{Fore.GREEN}✓ 额外学习进度导入完成，新增: {progress_count} 条")
        
        # 验证数据
        print(f"\n{Fore.YELLOW}==================================================")
        print(f"{Fore.YELLOW}验证数据")
        print(f"{Fore.YELLOW}==================================================")
        
        total_exams = db.exams.count_documents({})
        student_wang_exams = db.exams.count_documents({'user': ObjectId('507f1f77bcf86cd799439301')})
        total_progress = db.knowledgeprogresses.count_documents({})
        student_wang_progress = db.knowledgeprogresses.count_documents({'user': ObjectId('507f1f77bcf86cd799439301')})
        
        print(f"  - 总考试记录: {total_exams} 条")
        print(f"  - student_wang考试记录: {student_wang_exams} 条")
        print(f"  - 总学习进度: {total_progress} 条")
        print(f"  - student_wang学习进度: {student_wang_progress} 条")
        
        print(f"\n{Fore.CYAN}======================================================================")
        print(f"{Fore.GREEN}✓ 额外数据导入完成！")
        print(f"  - 新增考试记录: {exam_count} 条")
        print(f"  - 新增学习进度: {progress_count} 条")
        print(f"  - 完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{Fore.CYAN}======================================================================")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"{Fore.RED}❌ 导入失败: {str(e)}")
        return False

if __name__ == "__main__":
    success = import_additional_data()
    if success:
        print(f"\n{Fore.GREEN}🎉 现在student_wang应该有更丰富的学习数据，推荐算法可以提供个性化推荐了！")
    else:
        print(f"\n{Fore.RED}💥 数据导入失败，请检查错误信息。") 