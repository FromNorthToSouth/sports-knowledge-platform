#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import bcrypt
from colorama import init, Fore, Style

# 初始化colorama
init(autoreset=True)

def generate_password_hash(password):
    """生成bcrypt密码哈希，与Node.js后端保持一致"""
    # 使用与后端相同的cost factor (10)
    salt = bcrypt.gensalt(rounds=10)
    # 生成哈希
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(password, hashed_password):
    """验证密码哈希"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def update_user_passwords():
    """更新用户数据文件中的密码哈希"""
    try:
        print(f"{Fore.CYAN}======================================================================")
        print(f"{Fore.CYAN}体育知识智能题库平台 - 密码修复工具")
        print(f"{Fore.CYAN}======================================================================")
        
        # 读取用户数据
        with open('users.json', 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        print(f"{Fore.YELLOW}📋 当前用户数量: {len(users)}")
        print(f"{Fore.YELLOW}🔐 统一密码设置为: admin123456")
        print()
        
        # 生成新的密码哈希
        password = "admin123456"
        new_password_hash = generate_password_hash(password)
        
        print(f"{Fore.GREEN}✓ 生成新密码哈希:")
        print(f"   {new_password_hash}")
        print()
        
        # 验证哈希正确性
        is_valid = verify_password(password, new_password_hash)
        print(f"🔍 验证哈希: {Fore.GREEN if is_valid else Fore.RED}{'✓ 正确' if is_valid else '✗ 错误'}")
        print()
        
        if not is_valid:
            print(f"{Fore.RED}❌ 密码哈希生成失败！")
            return False
        
        # 更新所有用户的密码哈希
        updated_users = []
        for user in users:
            user['password'] = new_password_hash
            updated_users.append(user)
            print(f"{Fore.BLUE}🔄 更新用户: {user['username']} ({user['role']})")
        
        # 保存更新后的用户数据
        with open('users.json', 'w', encoding='utf-8') as f:
            json.dump(updated_users, f, ensure_ascii=False, indent=2)
        
        print()
        print(f"{Fore.GREEN}✅ 密码更新完成！")
        print(f"{Fore.GREEN}📊 更新用户数量: {len(updated_users)}")
        print()
        
        # 显示测试账户信息
        print(f"{Fore.CYAN}======================================================================")
        print(f"{Fore.CYAN}🎯 测试账户信息 (统一密码: admin123456)")
        print(f"{Fore.CYAN}======================================================================")
        
        for user in updated_users:
            role_color = {
                'super_admin': Fore.RED,
                'institution_admin': Fore.YELLOW,
                'teacher': Fore.GREEN,
                'student': Fore.BLUE
            }.get(user['role'], Fore.WHITE)
            
            print(f"{role_color}{user['role'].replace('_', ' ').title():<20} | 用户名: {user['username']:<15} | 邮箱: {user['email']}")
        
        print(f"{Fore.CYAN}======================================================================")
        
        return True
        
    except FileNotFoundError:
        print(f"{Fore.RED}❌ 找不到 users.json 文件！")
        return False
    except json.JSONDecodeError:
        print(f"{Fore.RED}❌ users.json 格式错误！")
        return False
    except Exception as e:
        print(f"{Fore.RED}❌ 更新密码失败: {str(e)}")
        return False

if __name__ == "__main__":
    success = update_user_passwords()
    if success:
        print(f"\n{Fore.GREEN}🎉 现在可以使用任意测试账户的用户名和密码 'admin123456' 登录了！")
    else:
        print(f"\n{Fore.RED}💥 密码修复失败，请检查错误信息。") 