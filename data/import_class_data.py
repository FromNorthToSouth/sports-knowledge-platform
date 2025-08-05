#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
班级和学生数据导入脚本
专门用于导入additional_students.json和classes.json数据
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
from colorama import init, Fore, Style

init(autoreset=True)

def convert_object_ids(data):
    """
    递归地将字符串ID转换为ObjectId
    """
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if key == '_id' and isinstance(value, str):
                result[key] = ObjectId(value)
            elif key in ['userId', 'teacherId', 'institutionId', 'institution'] and isinstance(value, str) and len(value) == 24:
                result[key] = ObjectId(value)
            else:
                result[key] = convert_object_ids(value)
        return result
    elif isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    else:
        return data

def import_class_data():
    """导入班级和学生数据"""
    try:
        print(f"{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}开始导入班级和学生数据")
        print(f"{Fore.CYAN}{'='*70}")
        
        # 连接数据库
        client = MongoClient('mongodb://localhost:27017')
        db = client['sports_knowledge_platform']
        
        # 1. 导入额外学生数据
        print(f"\n{Fore.YELLOW}步骤 1: 导入额外学生数据")
        print(f"{Fore.YELLOW}{'-'*50}")
        
        if os.path.exists('additional_students.json'):
            with open('additional_students.json', 'r', encoding='utf-8') as f:
                students_data = json.load(f)
            
            # 转换ObjectId
            students_data = convert_object_ids(students_data)
            
            # 检查是否已存在
            existing_count = 0
            new_count = 0
            
            for student in students_data:
                existing = db.users.find_one({'_id': student['_id']})
                if existing:
                    existing_count += 1
                    print(f"  - 学生已存在: {student['username']}")
                else:
                    db.users.insert_one(student)
                    new_count += 1
                    print(f"  + 新增学生: {student['username']}")
            
            print(f"{Fore.GREEN}✓ 学生数据导入完成:")
            print(f"  - 新增: {new_count} 名学生")
            print(f"  - 已存在: {existing_count} 名学生")
        else:
            print(f"{Fore.RED}✗ 未找到 additional_students.json 文件")
            return False
        
        # 2. 导入班级数据
        print(f"\n{Fore.YELLOW}步骤 2: 导入班级数据")
        print(f"{Fore.YELLOW}{'-'*50}")
        
        if os.path.exists('classes.json'):
            with open('classes.json', 'r', encoding='utf-8') as f:
                classes_data = json.load(f)
            
            # 转换ObjectId
            classes_data = convert_object_ids(classes_data)
            
            # 检查是否已存在
            existing_count = 0
            new_count = 0
            
            for class_data in classes_data:
                existing = db.classes.find_one({'_id': class_data['_id']})
                if existing:
                    existing_count += 1
                    print(f"  - 班级已存在: {class_data['name']}")
                else:
                    db.classes.insert_one(class_data)
                    new_count += 1
                    print(f"  + 新增班级: {class_data['name']} (学生数: {len(class_data.get('students', []))})")
            
            print(f"{Fore.GREEN}✓ 班级数据导入完成:")
            print(f"  - 新增: {new_count} 个班级")
            print(f"  - 已存在: {existing_count} 个班级")
        else:
            print(f"{Fore.RED}✗ 未找到 classes.json 文件")
            return False
        
        # 3. 验证数据
        print(f"\n{Fore.YELLOW}步骤 3: 验证数据完整性")
        print(f"{Fore.YELLOW}{'-'*50}")
        
        # 统计用户数据
        total_users = db.users.count_documents({})
        students = db.users.count_documents({'role': 'student'})
        teachers = db.users.count_documents({'role': 'teacher'})
        
        print(f"  - 总用户数: {total_users}")
        print(f"  - 学生用户: {students}")
        print(f"  - 教师用户: {teachers}")
        
        # 统计班级数据
        total_classes = db.classes.count_documents({})
        active_classes = db.classes.count_documents({'status': 'active'})
        
        print(f"  - 总班级数: {total_classes}")
        print(f"  - 活跃班级: {active_classes}")
        
        # 验证班级-学生关联
        for class_data in classes_data:
            class_name = class_data['name']
            student_count = len(class_data.get('students', []))
            
            # 验证班级中的学生是否存在
            missing_students = []
            for student in class_data.get('students', []):
                user_exists = db.users.find_one({'_id': student['userId']})
                if not user_exists:
                    missing_students.append(student['username'])
            
            if missing_students:
                print(f"  {Fore.RED}⚠ {class_name}: 缺少学生用户 {missing_students}")
            else:
                print(f"  {Fore.GREEN}✓ {class_name}: {student_count} 名学生，关联正常")
        
        # 4. 创建索引
        print(f"\n{Fore.YELLOW}步骤 4: 创建索引")
        print(f"{Fore.YELLOW}{'-'*50}")
        
        try:
            # 班级索引
            db.classes.create_index([("teacherId", 1), ("status", 1)])
            db.classes.create_index([("institutionId", 1), ("grade", 1)])
            db.classes.create_index("name")
            db.classes.create_index("students.userId")
            
            print(f"{Fore.GREEN}✓ 班级索引创建完成")
        except Exception as e:
            print(f"{Fore.YELLOW}⚠ 索引创建警告: {e}")
        
        print(f"\n{Fore.MAGENTA}{'='*70}")
        print(f"{Fore.GREEN}✓ 班级和学生数据导入完成！")
        print(f"{Fore.MAGENTA}{'='*70}")
        
        # 关闭连接
        client.close()
        return True
        
    except Exception as e:
        print(f"{Fore.RED}❌ 导入失败: {str(e)}")
        return False

def show_summary():
    """显示数据概览"""
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client['sports_knowledge_platform']
        
        print(f"\n{Fore.CYAN}{'='*50}")
        print(f"{Fore.CYAN}数据概览")
        print(f"{Fore.CYAN}{'='*50}")
        
        # 用户统计
        print(f"{Fore.YELLOW}用户统计:")
        for role in ['student', 'teacher', 'admin', 'super_admin']:
            count = db.users.count_documents({'role': role})
            print(f"  - {role}: {count} 人")
        
        # 班级统计
        print(f"\n{Fore.YELLOW}班级统计:")
        classes = list(db.classes.find({}, {'name': 1, 'grade': 1, 'students': 1, 'teacherName': 1}))
        for cls in classes:
            student_count = len(cls.get('students', []))
            print(f"  - {cls['name']} ({cls.get('grade', 'N/A')}): {student_count} 名学生 - 任课教师: {cls.get('teacherName', 'N/A')}")
        
        print(f"\n{Fore.GREEN}总计: {len(classes)} 个班级")
        
        client.close()
        
    except Exception as e:
        print(f"{Fore.RED}❌ 获取数据概览失败: {str(e)}")

if __name__ == "__main__":
    success = import_class_data()
    if success:
        show_summary()
    else:
        print(f"{Fore.RED}导入失败，请检查数据文件和数据库连接") 