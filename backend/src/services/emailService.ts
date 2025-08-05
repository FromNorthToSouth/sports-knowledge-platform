import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import User from '../models/User';

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface NotificationEmailData {
  type: string;
  priority: string;
  attachments?: Array<{
    type: string;
    title: string;
    url: string;
    fileId?: string;
  }>;
  actions?: Array<{
    id: string;
    label: string;
    type: string;
    url?: string;
    style?: string;
  }>;
}

class EmailService {
  private transporter: any;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  // 初始化邮件传输器
  private initializeTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // 开发环境配置
      ...(process.env.NODE_ENV === 'development' && {
        logger: true,
        debug: true
      })
    };

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('邮件服务初始化成功');
    } catch (error) {
      console.error('邮件服务初始化失败:', error);
      // 在开发环境下创建测试账号
      if (process.env.NODE_ENV === 'development') {
        this.createTestAccount();
      }
    }
  }

  // 创建测试邮件账号（开发环境）
  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('开发环境邮件测试账号创建成功:', {
        user: testAccount.user,
        pass: testAccount.pass
      });
    } catch (error) {
      console.error('创建测试邮件账号失败:', error);
    }
  }

  // 加载邮件模板
  private loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    
    // 如果模板目录不存在，创建默认模板
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      this.createDefaultTemplates(templatesDir);
    }

    try {
      const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));
      
      templateFiles.forEach(file => {
        const templateName = path.basename(file, '.hbs');
        const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      });

      console.log(`加载了 ${templateFiles.length} 个邮件模板`);
    } catch (error) {
      console.error('加载邮件模板失败:', error);
      this.createInlineTemplates();
    }
  }

  // 创建默认邮件模板文件
  private createDefaultTemplates(templatesDir: string) {
    const templates = {
      'notification': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 30px; border: 1px solid #dee2e6; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-urgent { border-left: 4px solid #fd7e14; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
        .btn { display: inline-block; padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 4px; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-success { background-color: #28a745; color: white; }
        .btn-warning { background-color: #ffc107; color: black; }
        .btn-danger { background-color: #dc3545; color: white; }
        .attachments { margin-top: 20px; }
        .attachment { display: inline-block; margin: 5px; padding: 8px 12px; background-color: #e9ecef; border-radius: 4px; text-decoration: none; color: #495057; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{title}}</h1>
            {{#if type}}
            <span class="badge">{{type}}</span>
            {{/if}}
        </div>
        <div class="content priority-{{priority}}">
            <p>{{{content}}}</p>
            
            {{#if attachments}}
            <div class="attachments">
                <h4>附件:</h4>
                {{#each attachments}}
                <a href="{{url}}" class="attachment">📎 {{title}}</a>
                {{/each}}
            </div>
            {{/if}}
            
            {{#if actions}}
            <div style="margin-top: 20px;">
                {{#each actions}}
                <a href="{{url}}" class="btn btn-{{style}}">{{label}}</a>
                {{/each}}
            </div>
            {{/if}}
            
            {{#if senderName}}
            <p style="margin-top: 30px; font-style: italic;">
                发送者: {{senderName}}
            </p>
            {{/if}}
        </div>
        <div class="footer">
            <p>这是一封系统自动发送的邮件，请勿回复。</p>
            <p>体育知识智能题库平台 &copy; {{year}}</p>
        </div>
    </div>
</body>
</html>`,

      'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>欢迎加入体育知识智能题库平台</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 30px; border: 1px solid #dee2e6; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 欢迎加入我们！</h1>
            <p>体育知识智能题库平台</p>
        </div>
        <div class="content">
            <h2>您好，{{username}}！</h2>
            <p>欢迎加入体育知识智能题库平台！我们很高兴您成为我们社区的一员。</p>
            
            <h3>您可以开始：</h3>
            <ul>
                <li>📚 浏览丰富的体育知识题库</li>
                <li>🎯 参与智能练习和模拟考试</li>
                <li>🏆 获得学习成就和奖励</li>
                <li>👥 与其他学习者交流讨论</li>
            </ul>
            
            <p>您的账号信息：</p>
            <ul>
                <li>用户名: {{username}}</li>
                <li>邮箱: {{email}}</li>
                <li>角色: {{role}}</li>
            </ul>
            
            <a href="{{loginUrl}}" class="btn">立即开始学习</a>
        </div>
    </div>
</body>
</html>`,

      'password-reset': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>密码重置</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: white; padding: 30px; border: 1px solid #dee2e6; }
        .btn { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 密码重置请求</h1>
        </div>
        <div class="content">
            <h2>您好，{{username}}！</h2>
            <p>我们收到了您的密码重置请求。</p>
            
            <div class="warning">
                <strong>⚠️ 安全提醒：</strong>
                <p>如果这不是您本人的操作，请忽略此邮件。您的密码将保持不变。</p>
            </div>
            
            <p>点击下面的按钮重置您的密码：</p>
            <a href="{{resetUrl}}" class="btn">重置密码</a>
            
            <p style="margin-top: 20px; font-size: 14px; color: #666;">
                此链接将在 {{expiryHours}} 小时后失效。<br>
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                {{resetUrl}}
            </p>
        </div>
    </div>
</body>
</html>`
    };

    Object.entries(templates).forEach(([name, content]) => {
      fs.writeFileSync(path.join(templatesDir, `${name}.hbs`), content);
    });
  }

  // 创建内联模板（当文件模板不可用时）
  private createInlineTemplates() {
    const notificationTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>{{title}}</h2>
      <div style="padding: 20px; border-left: 4px solid #007bff;">
        {{{content}}}
      </div>
      {{#if senderName}}
      <p><em>发送者: {{senderName}}</em></p>
      {{/if}}
    </div>`;

    this.templates.set('notification', handlebars.compile(notificationTemplate));
  }

  // 发送通知邮件
  async sendNotificationEmail(
    userId: string, 
    title: string, 
    content: string, 
    data: NotificationEmailData
  ): Promise<void> {
    try {
      // 获取用户信息
      const user = await User.findById(userId).select('email username').lean();
      if (!user || !user.email) {
        throw new Error('用户邮箱不存在');
      }

      // 准备模板数据
      const templateData = {
        title,
        content: content.replace(/\n/g, '<br>'),
        type: data.type,
        priority: data.priority,
        attachments: data.attachments,
        actions: data.actions,
        senderName: 'System',
        year: new Date().getFullYear()
      };

      // 渲染邮件内容
      const template = this.templates.get('notification');
      if (!template) {
        throw new Error('邮件模板不存在');
      }

      const htmlContent = template(templateData);

      // 发送邮件
      const mailOptions = {
        from: `"体育知识智能题库平台" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `【${this.getPriorityLabel(data.priority)}】${title}`,
        html: htmlContent,
        text: content // 纯文本版本
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // 开发环境显示预览URL
      if (process.env.NODE_ENV === 'development') {
        console.log('邮件发送成功！预览URL:', nodemailer.getTestMessageUrl(result));
      } else {
        console.log('邮件发送成功:', result.messageId);
      }
    } catch (error) {
      console.error('发送通知邮件失败:', error);
      throw error;
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(userId: string, userData: {
    username: string;
    email: string;
    role: string;
  }): Promise<void> {
    try {
      const template = this.templates.get('welcome');
      if (!template) {
        throw new Error('欢迎邮件模板不存在');
      }

      const templateData = {
        ...userData,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      };

      const htmlContent = template(templateData);

      const mailOptions = {
        from: `"体育知识智能题库平台" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: userData.email,
        subject: '🎉 欢迎加入体育知识智能题库平台',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('欢迎邮件发送成功！预览URL:', nodemailer.getTestMessageUrl(result));
      }
    } catch (error) {
      console.error('发送欢迎邮件失败:', error);
      throw error;
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(
    email: string, 
    username: string, 
    resetUrl: string, 
    expiryHours: number = 1
  ): Promise<void> {
    try {
      const template = this.templates.get('password-reset');
      if (!template) {
        throw new Error('密码重置邮件模板不存在');
      }

      const templateData = {
        username,
        resetUrl,
        expiryHours
      };

      const htmlContent = template(templateData);

      const mailOptions = {
        from: `"体育知识智能题库平台" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: '🔐 密码重置请求 - 体育知识智能题库平台',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('密码重置邮件发送成功！预览URL:', nodemailer.getTestMessageUrl(result));
      }
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      throw error;
    }
  }

  // 发送系统公告邮件
  async sendAnnouncementEmail(
    recipients: string[], 
    title: string, 
    content: string, 
    priority: string = 'medium'
  ): Promise<void> {
    try {
      const users = await User.find({
        _id: { $in: recipients }
      }).select('email username').lean();

      const template = this.templates.get('notification');
      if (!template) {
        throw new Error('邮件模板不存在');
      }

      const templateData = {
        title,
        content: content.replace(/\n/g, '<br>'),
        type: 'announcement',
        priority,
        senderName: '系统管理员',
        year: new Date().getFullYear()
      };

      const htmlContent = template(templateData);

      // 批量发送
      const promises = users.map(user => {
        const mailOptions = {
          from: `"体育知识智能题库平台" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `【系统公告】${title}`,
          html: htmlContent,
          text: content
        };

        return this.transporter.sendMail(mailOptions);
      });

      await Promise.allSettled(promises);
      console.log(`系统公告邮件发送完成，共 ${users.length} 个收件人`);
    } catch (error) {
      console.error('发送系统公告邮件失败:', error);
      throw error;
    }
  }

  // 发送邮件摘要（每天/每周汇总）
  async sendDigestEmail(
    userId: string, 
    notifications: any[], 
    period: 'daily' | 'weekly'
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('email username').lean();
      if (!user || !user.email) {
        return;
      }

      const periodText = period === 'daily' ? '每日' : '每周';
      const title = `${periodText}通知摘要`;

      let content = `<h3>您有 ${notifications.length} 条新通知：</h3><ul>`;
      notifications.forEach(notification => {
        content += `<li><strong>${notification.title}</strong> - ${notification.content.substring(0, 100)}...</li>`;
      });
      content += '</ul>';

      const template = this.templates.get('notification');
      if (!template) {
        throw new Error('邮件模板不存在');
      }

      const templateData = {
        title,
        content,
        type: 'digest',
        priority: 'low',
        senderName: '系统',
        year: new Date().getFullYear()
      };

      const htmlContent = template(templateData);

      const mailOptions = {
        from: `"体育知识智能题库平台" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `📋 ${title} - 体育知识智能题库平台`,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('发送邮件摘要失败:', error);
      throw error;
    }
  }

  // 获取优先级标签
  private getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'urgent': '紧急',
      'high': '重要',
      'medium': '一般',
      'low': '低'
    };
    return labels[priority] || '一般';
  }

  // 验证邮件服务状态
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('邮件服务连接正常');
      return true;
    } catch (error) {
      console.error('邮件服务连接失败:', error);
      return false;
    }
  }

  // 获取邮件发送统计
  async getEmailStats(): Promise<any> {
    // 这里可以实现邮件发送统计功能
    // 比如集成数据库记录或外部分析服务
    return {
      totalSent: 0,
      successRate: 100,
      bounceRate: 0,
      openRate: 0
    };
  }
}

export default new EmailService(); 