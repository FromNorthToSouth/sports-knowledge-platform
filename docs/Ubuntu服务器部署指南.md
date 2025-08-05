# 体育知识智能题库平台 - Ubuntu服务器部署指南

## 📋 文档概述

本文档提供在Ubuntu服务器上部署体育知识智能题库平台的完整指南，包括环境配置、服务安装、项目部署和运维管理。

**支持系统版本**: Ubuntu 20.04 LTS / Ubuntu 22.04 LTS  
**文档版本**: v1.0  
**更新时间**: 2024年12月

---

## 🎯 部署架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Nginx                                  │
│            (反向代理 + SSL)                              │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼────────┐       ┌───────▼────────┐
│   前端服务       │       │   后端API服务   │
│   (React)       │       │   (Node.js)    │
│   Port: 3000    │       │   Port: 5000   │
└─────────────────┘       └────────┬───────┘
                                   │
                          ┌────────▼────────┐
                          │   MongoDB       │
                          │   Port: 27017   │
                          └─────────────────┘
```

---

## 🔧 第一步：系统环境准备

### 1.1 更新系统包

```bash
# 更新包列表
sudo apt update

# 升级已安装的包
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim htop tree unzip software-properties-common
```

### 1.2 创建部署用户

```bash
# 创建部署用户(可选，建议不直接使用root)
sudo adduser sportapp
sudo usermod -aG sudo sportapp

# 切换到部署用户
su - sportapp
```

### 1.3 配置防火墙

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH连接
sudo ufw allow ssh
sudo ufw allow 22

# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 允许Node.js开发端口(可选，生产环境建议关闭)
sudo ufw allow 3000
sudo ufw allow 5000

# 查看防火墙状态
sudo ufw status
```

---

## 🟢 第二步：Node.js环境安装

### 2.1 安装Node.js (推荐使用NodeSource repository)

```bash
# 添加NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x
npm --version   # 应该显示 9.x.x
```

### 2.2 配置npm全局包权限(可选)

```bash
# 创建全局包目录
mkdir ~/.npm-global

# 配置npm使用新目录
npm config set prefix '~/.npm-global'

# 添加到PATH(添加到~/.bashrc)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 2.3 安装PM2进程管理器

```bash
# 全局安装PM2
npm install -g pm2

# 验证安装
pm2 --version
```

---

## 🍃 第三步：MongoDB数据库安装

### 3.1 安装MongoDB

```bash
# 导入MongoDB GPG密钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 更新包列表
sudo apt-get update

# 安装MongoDB
sudo apt-get install -y mongodb-org

# 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
sudo systemctl status mongod
```

### 3.2 配置MongoDB

```bash
# 编辑MongoDB配置文件
sudo vim /etc/mongod.conf
```

**修改配置文件内容**：
```yaml
# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # 仅本地访问

# security
security:
  authorization: enabled  # 启用认证

# storage
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
```

### 3.3 创建数据库用户

```bash
# 连接到MongoDB
mongosh

# 切换到admin数据库
use admin

# 创建管理员用户
db.createUser({
  user: "admin",
  pwd: "your_admin_password_here",  // 请修改为强密码
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# 创建应用数据库用户
use sportsdb
db.createUser({
  user: "sportsapp",
  pwd: "your_app_password_here",    // 请修改为强密码
  roles: [ { role: "readWrite", db: "sportsdb" } ]
})

# 退出MongoDB shell
exit
```

### 3.4 重启MongoDB服务

```bash
# 重启MongoDB以应用配置
sudo systemctl restart mongod

# 测试认证连接
mongosh --host localhost --port 27017 -u sportsapp -p your_app_password_here --authenticationDatabase sportsdb
```

---

## 📦 第四步：项目代码部署

### 4.1 创建项目目录

```bash
# 创建应用目录
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# 克隆项目代码
git clone https://github.com/your-repo/sports-knowledge-platform.git
# 或者上传项目文件
# scp -r ./qa ubuntu@your-server:/var/www/

# 进入项目目录
cd sports-knowledge-platform
```

### 4.2 部署后端服务

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install --production

# 创建环境变量文件
cp config.example.env .env

# 编辑环境变量
vim .env
```

**后端环境变量配置 (.env)**：
```bash
# 服务端口
PORT=5000

# 数据库连接
MONGODB_URI=mongodb://sportsapp:your_app_password_here@localhost:27017/sportsdb

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# 文件上传路径
UPLOAD_PATH=/var/www/sports-knowledge-platform/uploads

# 阿里云千问AI配置
DASHSCOPE_API_KEY=your_dashscope_api_key_here
DASHSCOPE_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen3-235b-a22b-instruct-2507

# 邮件服务配置(可选)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# 短信服务配置(可选)
SMS_ACCESS_KEY=your_sms_access_key
SMS_ACCESS_SECRET=your_sms_access_secret

# 生产环境标识
NODE_ENV=production
```

### 4.3 部署前端服务

```bash
# 返回项目根目录
cd ../frontend

# 安装依赖
npm install

# 创建生产环境配置
vim .env.production
```

**前端环境变量配置 (.env.production)**：
```bash
# API地址
REACT_APP_API_URL=https://your-domain.com/api

# 其他配置
REACT_APP_UPLOAD_URL=https://your-domain.com/uploads
GENERATE_SOURCEMAP=false
```

```bash
# 构建生产版本
npm run build

# 创建构建文件目录
sudo mkdir -p /var/www/html
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

---

## 🚀 第五步：服务启动和管理

### 5.1 配置PM2启动后端服务

```bash
# 回到后端目录
cd /var/www/sports-knowledge-platform/backend

# 创建PM2配置文件
vim ecosystem.config.js
```

**PM2配置文件 (ecosystem.config.js)**：
```javascript
module.exports = {
  apps: [{
    name: 'sports-api',
    script: 'dist/index.js',  // 如果使用TypeScript编译后的文件
    // script: 'src/index.ts', // 如果直接运行TypeScript
    instances: 'max',         // 利用所有CPU核心
    exec_mode: 'cluster',     // 集群模式
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    // 如果使用TypeScript
    // interpreter: './node_modules/.bin/ts-node',
    // interpreter_args: '--transpile-only'
  }]
};
```

### 5.2 编译TypeScript (如果使用)

```bash
# 安装TypeScript编译器
npm install -g typescript

# 编译项目
npm run build
# 或者
tsc

# 创建日志目录
mkdir -p logs
```

### 5.3 启动服务

```bash
# 使用PM2启动服务
pm2 start ecosystem.config.js

# 查看服务状态
pm2 status

# 查看日志
pm2 logs sports-api

# 设置PM2开机自启动
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 保存PM2进程列表
pm2 save
```

---

## 🌐 第六步：Nginx反向代理配置

### 6.1 安装Nginx

```bash
# 安装Nginx
sudo apt install -y nginx

# 启动Nginx服务
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 6.2 配置Nginx虚拟主机

```bash
# 创建站点配置文件
sudo vim /etc/nginx/sites-available/sports-platform
```

**Nginx配置文件**：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # 文件上传目录
    location /uploads/ {
        alias /var/www/sports-knowledge-platform/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # 日志
    access_log /var/log/nginx/sports-platform.access.log;
    error_log /var/log/nginx/sports-platform.error.log;
}
```

### 6.3 启用站点配置

```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/sports-platform /etc/nginx/sites-enabled/

# 删除默认站点(可选)
sudo rm /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 重启Nginx
sudo systemctl reload nginx
```

---

## 🔒 第七步：SSL证书配置

### 7.1 安装Certbot

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 7.2 自动续期配置

```bash
# 测试续期
sudo certbot renew --dry-run

# 查看续期定时任务
sudo crontab -l

# 如果没有自动添加，手动添加续期任务
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7.3 配置SSL后的Nginx (Certbot会自动修改)

验证SSL配置后的Nginx文件：
```bash
sudo vim /etc/nginx/sites-available/sports-platform
```

应该包含SSL重定向和HTTPS配置。

---

## 📊 第八步：监控和日志配置

### 8.1 配置日志轮转

```bash
# 创建日志轮转配置
sudo vim /etc/logrotate.d/sports-platform
```

**日志轮转配置**：
```
/var/www/sports-knowledge-platform/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload sports-api
    endscript
}
```

### 8.2 设置监控脚本

```bash
# 创建监控脚本目录
mkdir -p /home/$USER/scripts

# 创建服务监控脚本
vim /home/$USER/scripts/monitor.sh
```

**监控脚本**：
```bash
#!/bin/bash

LOG_FILE="/var/log/sports-platform-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 检查后端API服务
if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "[$DATE] API服务异常，尝试重启" >> $LOG_FILE
    pm2 restart sports-api
fi

# 检查MongoDB
if ! systemctl is-active --quiet mongod; then
    echo "[$DATE] MongoDB服务异常，尝试重启" >> $LOG_FILE
    sudo systemctl restart mongod
fi

# 检查Nginx
if ! systemctl is-active --quiet nginx; then
    echo "[$DATE] Nginx服务异常，尝试重启" >> $LOG_FILE
    sudo systemctl restart nginx
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2{printf "%.0f", $5}')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] 磁盘使用率过高: $DISK_USAGE%" >> $LOG_FILE
fi

# 检查内存使用
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 80 ]; then
    echo "[$DATE] 内存使用率过高: $MEM_USAGE%" >> $LOG_FILE
fi
```

```bash
# 添加执行权限
chmod +x /home/$USER/scripts/monitor.sh

# 添加到定时任务
crontab -e
# 添加：每5分钟检查一次
# */5 * * * * /home/$USER/scripts/monitor.sh
```

### 8.3 设置系统资源监控

```bash
# 安装htop和iotop
sudo apt install -y htop iotop

# 查看实时进程
htop

# 查看PM2进程监控
pm2 monit
```

---

## 💾 第九步：备份策略

### 9.1 数据库备份脚本

```bash
# 创建备份目录
sudo mkdir -p /backup/mongodb
sudo chown $USER:$USER /backup

# 创建数据库备份脚本
vim /home/$USER/scripts/backup-db.sh
```

**数据库备份脚本**：
```bash
#!/bin/bash

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sportsdb"
DB_USER="sportsapp"
DB_PASS="your_app_password_here"

# 创建备份
mongodump --host localhost --port 27017 --db $DB_NAME --username $DB_USER --password $DB_PASS --out $BACKUP_DIR/$DATE

# 压缩备份
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "数据库备份完成: backup_$DATE.tar.gz"
```

### 9.2 文件备份脚本

```bash
# 创建文件备份脚本
vim /home/$USER/scripts/backup-files.sh
```

**文件备份脚本**：
```bash
#!/bin/bash

BACKUP_DIR="/backup/files"
DATE=$(date +%Y%m%d_%H%M%S)
SOURCE_DIR="/var/www/sports-knowledge-platform"

mkdir -p $BACKUP_DIR

# 备份项目文件和uploads
tar -czf $BACKUP_DIR/files_$DATE.tar.gz \
    --exclude="$SOURCE_DIR/backend/node_modules" \
    --exclude="$SOURCE_DIR/frontend/node_modules" \
    --exclude="$SOURCE_DIR/backend/logs" \
    $SOURCE_DIR

# 删除30天前的文件备份
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +30 -delete

echo "文件备份完成: files_$DATE.tar.gz"
```

### 9.3 设置自动备份

```bash
# 添加执行权限
chmod +x /home/$USER/scripts/backup-*.sh

# 设置定时备份
crontab -e
# 添加：每天凌晨2点备份数据库，3点备份文件
# 0 2 * * * /home/$USER/scripts/backup-db.sh
# 0 3 * * * /home/$USER/scripts/backup-files.sh
```

---

## 🔧 第十步：系统优化

### 10.1 系统参数优化

```bash
# 编辑系统限制
sudo vim /etc/security/limits.conf
```

**添加以下内容**：
```
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
```

```bash
# 编辑系统内核参数
sudo vim /etc/sysctl.conf
```

**添加以下内容**：
```
# 网络优化
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000

# 内存优化
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# 文件描述符
fs.file-max = 2097152
```

```bash
# 应用参数
sudo sysctl -p
```

### 10.2 Node.js进程优化

```bash
# 编辑PM2配置优化内存和CPU使用
vim /var/www/sports-knowledge-platform/backend/ecosystem.config.js
```

**优化后的PM2配置**：
```javascript
module.exports = {
  apps: [{
    name: 'sports-api',
    script: 'dist/index.js',
    instances: 2,  // 根据CPU核心数调整
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '500M',  // 内存限制
    node_args: '--max-old-space-size=512',
    min_uptime: '10s',
    max_restarts: 5,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

---

## 🚨 第十一步：安全加固

### 11.1 SSH安全配置

```bash
# 编辑SSH配置
sudo vim /etc/ssh/sshd_config
```

**推荐SSH安全设置**：
```
Port 2222  # 修改默认端口
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

```bash
# 重启SSH服务
sudo systemctl restart ssh

# 记得在UFW中开放新端口
sudo ufw allow 2222
sudo ufw delete allow 22
```

### 11.2 安装Fail2ban

```bash
# 安装Fail2ban
sudo apt install -y fail2ban

# 创建本地配置
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# 编辑配置
sudo vim /etc/fail2ban/jail.local
```

**Fail2ban配置优化**：
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
```

```bash
# 启动Fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 11.3 定期安全更新

```bash
# 安装unattended-upgrades
sudo apt install -y unattended-upgrades

# 配置自动安全更新
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 🚀 第十二步：部署验证

### 12.1 服务状态检查

```bash
# 检查所有服务状态
sudo systemctl status nginx
sudo systemctl status mongod
pm2 status

# 检查端口监听
sudo netstat -tlnp | grep -E ":(80|443|5000|27017)"

# 检查日志
tail -f /var/log/nginx/sports-platform.access.log
pm2 logs sports-api
```

### 12.2 功能测试

```bash
# 测试API健康检查
curl http://localhost:5000/api/health

# 测试前端访问
curl http://localhost/

# 测试HTTPS (如果配置了SSL)
curl https://your-domain.com/
```

### 12.3 性能测试

```bash
# 安装Apache Bench
sudo apt install -y apache2-utils

# 简单压力测试
ab -n 100 -c 10 http://localhost:5000/api/health

# 监控系统资源
htop
iotop
```

---

## 📚 附录：常用运维命令

### PM2 常用命令

```bash
# 查看所有进程
pm2 list

# 重启应用
pm2 restart sports-api

# 停止应用
pm2 stop sports-api

# 删除应用
pm2 delete sports-api

# 查看日志
pm2 logs sports-api

# 清空日志
pm2 flush

# 监控面板
pm2 monit

# 保存进程列表
pm2 save

# 重新加载配置
pm2 reload ecosystem.config.js
```

### MongoDB 常用命令

```bash
# 连接数据库
mongosh --host localhost --port 27017 -u sportsapp -p --authenticationDatabase sportsdb

# 查看数据库状态
mongosh --eval "db.serverStatus()"

# 备份数据库
mongodump --host localhost --port 27017 --db sportsdb --username sportsapp --password your_password --out /backup/

# 恢复数据库
mongorestore --host localhost --port 27017 --db sportsdb --username sportsapp --password your_password /backup/sportsdb/
```

### Nginx 常用命令

```bash
# 测试配置文件
sudo nginx -t

# 重新加载配置
sudo nginx -s reload

# 查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 系统监控命令

```bash
# 查看系统资源
htop
top

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
ss -tulpn

# 查看系统负载
uptime

# 查看进程占用端口
sudo lsof -i :5000
```

---

## 🔧 故障排除指南

### 常见问题及解决方案

#### 1. 后端API服务无法启动

**问题现象**：PM2显示服务状态为stopped或errored

**排查步骤**：
```bash
# 查看错误日志
pm2 logs sports-api

# 检查端口是否被占用
sudo lsof -i :5000

# 检查环境变量
cat /var/www/sports-knowledge-platform/backend/.env

# 检查数据库连接
mongosh --host localhost --port 27017 -u sportsapp -p --authenticationDatabase sportsdb
```

**常见解决方案**：
- 检查.env文件中的数据库连接信息
- 确保MongoDB服务正在运行
- 检查文件权限是否正确
- 确保所有依赖包已安装

#### 2. 前端页面无法访问

**问题现象**：浏览器显示404或502错误

**排查步骤**：
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查前端文件是否存在
ls -la /var/www/html/
```

**常见解决方案**：
- 重新构建前端项目：`npm run build`
- 检查Nginx配置文件路径
- 确保文件权限正确：`sudo chown -R www-data:www-data /var/www/html`
- 重启Nginx服务

#### 3. 数据库连接失败

**问题现象**：API返回数据库连接错误

**排查步骤**：
```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 查看MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log

# 测试数据库连接
mongosh --host localhost --port 27017 -u sportsapp -p --authenticationDatabase sportsdb
```

**常见解决方案**：
- 重启MongoDB服务：`sudo systemctl restart mongod`
- 检查数据库用户权限
- 确认防火墙设置
- 检查.env文件中的连接字符串

#### 4. SSL证书问题

**问题现象**：HTTPS访问显示证书错误

**排查步骤**：
```bash
# 检查证书状态
sudo certbot certificates

# 测试证书续期
sudo certbot renew --dry-run

# 检查Nginx SSL配置
sudo nginx -t
```

**常见解决方案**：
- 重新申请证书：`sudo certbot --nginx -d your-domain.com`
- 检查域名DNS解析
- 确保防火墙开放443端口

---

## 📋 部署检查清单

### 部署前检查
- [ ] 服务器系统已更新
- [ ] 防火墙已正确配置
- [ ] 域名DNS已解析到服务器IP
- [ ] SSL证书已准备(如果使用HTTPS)

### 环境安装检查
- [ ] Node.js 18.x 已安装
- [ ] PM2 已安装
- [ ] MongoDB 6.0 已安装并配置
- [ ] Nginx 已安装并配置

### 项目部署检查
- [ ] 项目代码已上传
- [ ] 后端依赖已安装
- [ ] 前端已构建并部署
- [ ] 环境变量已正确配置
- [ ] 数据库用户已创建

### 服务启动检查
- [ ] 后端API服务已启动
- [ ] Nginx服务已启动
- [ ] MongoDB服务已启动
- [ ] 所有服务已设置开机自启

### 功能验证检查
- [ ] 前端页面可正常访问
- [ ] API接口响应正常
- [ ] 用户注册登录功能正常
- [ ] 文件上传功能正常
- [ ] 数据库读写正常

### 安全配置检查
- [ ] SSH端口已修改
- [ ] 密码认证已禁用
- [ ] Fail2ban已配置
- [ ] 防火墙规则已设置
- [ ] SSL证书已配置(如果使用)

### 监控和备份检查
- [ ] 日志轮转已配置
- [ ] 监控脚本已设置
- [ ] 数据库备份已配置
- [ ] 文件备份已配置
- [ ] 定时任务已设置

---

## 🎯 性能优化建议

### 服务器配置建议

**最低配置**：
- CPU: 2核心
- 内存: 4GB
- 硬盘: 50GB SSD
- 带宽: 5Mbps

**推荐配置**：
- CPU: 4核心
- 内存: 8GB
- 硬盘: 100GB SSD
- 带宽: 10Mbps

**高负载配置**：
- CPU: 8核心
- 内存: 16GB
- 硬盘: 200GB SSD
- 带宽: 20Mbps

### 扩展部署架构

对于高负载场景，可以考虑以下架构：

```
负载均衡器 (Nginx/HAProxy)
    │
    ├── Web服务器 1 (前端 + API)
    ├── Web服务器 2 (前端 + API)
    └── Web服务器 3 (前端 + API)
    │
    └── 数据库集群 (MongoDB副本集)
```

---

**总结**：按照本部署指南，您可以在Ubuntu服务器上成功部署体育知识智能题库平台。建议在部署过程中仔细检查每个步骤，确保所有服务正常运行。部署完成后，定期进行系统维护和安全更新。