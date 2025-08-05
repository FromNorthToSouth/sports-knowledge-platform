#!/usr/bin/env python3
import bcrypt

# 从导出文件中的密码哈希
exported_hash = "$2b$12$9pmkgBqOCuFw5Aso2ip7TOQ8rwDefq4A9sWioWmz5NFZi2YIhEhu."
password = "admin123456"

print("=== 密码验证测试 ===")
print(f"密码: {password}")
print(f"哈希: {exported_hash}")

try:
    is_valid = bcrypt.checkpw(password.encode('utf-8'), exported_hash.encode('utf-8'))
    print(f"验证结果: {'✓ 正确' if is_valid else '✗ 错误'}")
    
    if is_valid:
        print("✅ 密码哈希验证成功！登录问题不在密码验证环节。")
    else:
        print("❌ 密码哈希验证失败！需要重新生成密码哈希。")
        
except Exception as e:
    print(f"❌ 验证过程出错: {e}")
    
print("\n=== 建议检查项 ===")
print("1. 后端服务器是否正在运行")
print("2. 前端是否能正确连接到后端API")
print("3. 数据库连接是否正常")
print("4. 用户是否使用正确的用户名和密码") 