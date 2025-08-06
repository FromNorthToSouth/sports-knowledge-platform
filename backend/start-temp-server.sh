#!/bin/bash

echo "🚀 正在启动临时后端服务器..."
echo "📍 工作目录: $(pwd)"
echo "⏰ 启动时间: $(date)"

# 检查是否已有Node.js进程在运行
if pgrep -f "temp-server.js" > /dev/null; then
    echo "⚠️  发现已有临时服务器进程正在运行，正在停止..."
    pkill -f "temp-server.js"
    sleep 2
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查临时服务器文件是否存在
if [ ! -f "temp-server.js" ]; then
    echo "❌ temp-server.js 文件不存在"
    exit 1
fi

echo "🔄 启动临时服务器..."
node temp-server.js 