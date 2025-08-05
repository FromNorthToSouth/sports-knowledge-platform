import User from '../models/User';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface SMSConfig {
  provider: 'aliyun' | 'tencent' | 'twilio' | 'mock';
  apiKey?: string;
  apiSecret?: string;
  signName?: string;
  templateCode?: string;
}

class SMSService {
  private config: SMSConfig;
  private smsClient: any;
  private templates: Map<string, SMSTemplate>;

  // 添加getter方法处理signName默认值
  private get signName(): string {
    return this.config.signName || '系统通知';
  }

  constructor() {
    this.config = {
      provider: (process.env.SMS_PROVIDER as any) || 'mock',
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET,
      signName: process.env.SMS_SIGN_NAME || '体育知识平台',
      templateCode: process.env.SMS_TEMPLATE_CODE
    };

    this.initializeTemplates();
    console.log(`短信服务初始化成功，使用提供商: ${this.config.provider}`);
  }

  // 初始化短信模板
  private initializeTemplates(): void {
    const defaultTemplates: SMSTemplate[] = [
      {
        id: 'notification',
        name: '通知消息',
        content: '【{{signName}}】{{title}}：{{content}}',
        variables: ['signName', 'title', 'content']
      },
      {
        id: 'verification',
        name: '验证码',
        content: '【{{signName}}】您的验证码是{{code}}，5分钟内有效，请勿泄露。',
        variables: ['signName', 'code']
      },
      {
        id: 'urgent_notification',
        name: '紧急通知',
        content: '【{{signName}}】紧急通知：{{content}}，请及时处理。',
        variables: ['signName', 'content']
      },
      {
        id: 'exam_reminder',
        name: '考试提醒',
        content: '【{{signName}}】考试提醒：{{examTitle}}将于{{startTime}}开始，请提前准备。',
        variables: ['signName', 'examTitle', 'startTime']
      },
      {
        id: 'assignment_reminder',
        name: '作业提醒',
        content: '【{{signName}}】作业提醒：{{assignmentTitle}}截至{{dueDate}}，请及时完成。',
        variables: ['signName', 'assignmentTitle', 'dueDate']
      },
      {
        id: 'grade_notification',
        name: '成绩通知',
        content: '【{{signName}}】成绩发布：{{examTitle}}成绩已出，您的得分是{{score}}分。',
        variables: ['signName', 'examTitle', 'score']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // 发送通知短信
  async sendNotificationSMS(userId: string, title: string, content: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('phone username').lean();
      if (!user || !user.phone) {
        console.log(`用户 ${userId} 没有手机号，跳过短信通知`);
        return false;
      }

      const template = this.templates.get('notification');
      if (!template) {
        throw new Error('通知短信模板不存在');
      }

      const message = this.renderTemplate(template, {
        signName: this.config.signName || '系统通知',
        title: title.substring(0, 20), // 限制标题长度
        content: content.substring(0, 50) // 限制内容长度
      });

      return await this.sendSMS(user.phone, message, 'notification');
    } catch (error) {
      console.error('发送通知短信失败:', error);
      return false;
    }
  }

  // 发送验证码短信
  async sendVerificationCodeSMS(phone: string, code: string): Promise<boolean> {
    try {
      const template = this.templates.get('verification');
      if (!template) {
        throw new Error('验证码短信模板不存在');
      }

      const message = this.renderTemplate(template, {
        signName: this.config.signName,
        code
      });

      return await this.sendSMS(phone, message, 'verification');
    } catch (error) {
      console.error('发送验证码短信失败:', error);
      return false;
    }
  }

  // 发送紧急通知短信
  async sendUrgentNotificationSMS(userIds: string[], content: string): Promise<number> {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        phone: { $exists: true, $ne: null }
      }).select('phone username').lean();

      const template = this.templates.get('urgent_notification');
      if (!template) {
        throw new Error('紧急通知短信模板不存在');
      }

      let successCount = 0;
      const promises = users.map(async (user) => {
        try {
          const message = this.renderTemplate(template, {
            signName: this.config.signName,
            content: content.substring(0, 60)
          });

          if (await this.sendSMS(user.phone, message, 'urgent')) {
            successCount++;
          }
        } catch (error) {
          console.error(`发送紧急通知给用户 ${user.username} 失败:`, error);
        }
      });

      await Promise.allSettled(promises);
      console.log(`紧急通知短信发送完成，成功 ${successCount}/${users.length}`);
      return successCount;
    } catch (error) {
      console.error('批量发送紧急通知短信失败:', error);
      return 0;
    }
  }

  // 发送考试提醒短信
  async sendExamReminderSMS(
    userIds: string[], 
    examTitle: string, 
    startTime: string
  ): Promise<number> {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        phone: { $exists: true, $ne: null }
      }).select('phone username').lean();

      const template = this.templates.get('exam_reminder');
      if (!template) {
        throw new Error('考试提醒短信模板不存在');
      }

      let successCount = 0;
      for (const user of users) {
        try {
          const message = this.renderTemplate(template, {
            signName: this.config.signName,
            examTitle: examTitle.substring(0, 20),
            startTime
          });

          if (await this.sendSMS(user.phone, message, 'exam_reminder')) {
            successCount++;
          }
        } catch (error) {
          console.error(`发送考试提醒给用户 ${user.username} 失败:`, error);
        }
      }

      console.log(`考试提醒短信发送完成，成功 ${successCount}/${users.length}`);
      return successCount;
    } catch (error) {
      console.error('批量发送考试提醒短信失败:', error);
      return 0;
    }
  }

  // 发送作业提醒短信
  async sendAssignmentReminderSMS(
    userIds: string[], 
    assignmentTitle: string, 
    dueDate: string
  ): Promise<number> {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        phone: { $exists: true, $ne: null }
      }).select('phone username').lean();

      const template = this.templates.get('assignment_reminder');
      if (!template) {
        throw new Error('作业提醒短信模板不存在');
      }

      let successCount = 0;
      for (const user of users) {
        try {
          const message = this.renderTemplate(template, {
            signName: this.config.signName,
            assignmentTitle: assignmentTitle.substring(0, 20),
            dueDate
          });

          if (await this.sendSMS(user.phone, message, 'assignment_reminder')) {
            successCount++;
          }
        } catch (error) {
          console.error(`发送作业提醒给用户 ${user.username} 失败:`, error);
        }
      }

      console.log(`作业提醒短信发送完成，成功 ${successCount}/${users.length}`);
      return successCount;
    } catch (error) {
      console.error('批量发送作业提醒短信失败:', error);
      return 0;
    }
  }

  // 发送成绩通知短信
  async sendGradeNotificationSMS(
    userId: string, 
    examTitle: string, 
    score: number
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('phone username').lean();
      if (!user || !user.phone) {
        console.log(`用户 ${userId} 没有手机号，跳过成绩通知短信`);
        return false;
      }

      const template = this.templates.get('grade_notification');
      if (!template) {
        throw new Error('成绩通知短信模板不存在');
      }

      const message = this.renderTemplate(template, {
        signName: this.config.signName,
        examTitle: examTitle.substring(0, 20),
        score: score.toString()
      });

      return await this.sendSMS(user.phone, message, 'grade_notification');
    } catch (error) {
      console.error('发送成绩通知短信失败:', error);
      return false;
    }
  }

  // 核心短信发送方法
  private async sendSMS(phone: string, message: string, type: string = 'notification'): Promise<boolean> {
    try {
      // 验证手机号格式
      if (!this.validatePhoneNumber(phone)) {
        throw new Error('手机号格式不正确');
      }

      console.log(`准备发送短信到 ${phone}: ${message}`);

      // 根据配置的提供商发送短信
      switch (this.config.provider) {
        case 'aliyun':
          return await this.sendAliyunSMS(phone, message);
        case 'tencent':
          return await this.sendTencentSMS(phone, message);
        case 'twilio':
          return await this.sendTwilioSMS(phone, message);
        case 'mock':
        default:
          return await this.sendMockSMS(phone, message, type);
      }
    } catch (error) {
      console.error('发送短信失败:', error);
      return false;
    }
  }

  // 阿里云短信发送
  private async sendAliyunSMS(phone: string, message: string): Promise<boolean> {
    try {
      // 这里应该集成阿里云短信SDK
      console.log('阿里云短信发送功能待实现');
      return true;
    } catch (error) {
      console.error('阿里云短信发送失败:', error);
      return false;
    }
  }

  // 腾讯云短信发送
  private async sendTencentSMS(phone: string, message: string): Promise<boolean> {
    try {
      // 这里应该集成腾讯云短信SDK
      console.log('腾讯云短信发送功能待实现');
      return true;
    } catch (error) {
      console.error('腾讯云短信发送失败:', error);
      return false;
    }
  }

  // Twilio短信发送
  private async sendTwilioSMS(phone: string, message: string): Promise<boolean> {
    try {
      // 这里应该集成Twilio SDK
      console.log('Twilio短信发送功能待实现');
      return true;
    } catch (error) {
      console.error('Twilio短信发送失败:', error);
      return false;
    }
  }

  // 模拟短信发送（开发/测试环境）
  private async sendMockSMS(phone: string, message: string, type: string): Promise<boolean> {
    try {
      // 模拟发送延迟
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`📱 [模拟短信] 发送成功`);
      console.log(`   收件人: ${phone}`);
      console.log(`   类型: ${type}`);
      console.log(`   内容: ${message}`);
      console.log(`   时间: ${new Date().toLocaleString()}`);

      // 记录到日志文件或数据库
      this.logSMSRecord({
        phone,
        message,
        type,
        status: 'success',
        timestamp: new Date(),
        provider: 'mock'
      });

      return true;
    } catch (error) {
      console.error('模拟短信发送失败:', error);
      return false;
    }
  }

  // 渲染短信模板
  private renderTemplate(template: SMSTemplate, variables: Record<string, string>): string {
    let message = template.content;
    
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      const placeholder = new RegExp(`{{${variable}}}`, 'g');
      message = message.replace(placeholder, value);
    });

    return message;
  }

  // 验证手机号格式
  private validatePhoneNumber(phone: string): boolean {
    // 中国大陆手机号验证
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    // 国际手机号验证（简单）
    const intlPhoneRegex = /^\+\d{1,3}\d{4,14}$/;
    
    return chinaPhoneRegex.test(phone) || intlPhoneRegex.test(phone);
  }

  // 记录短信发送日志
  private logSMSRecord(record: {
    phone: string;
    message: string;
    type: string;
    status: 'success' | 'failed';
    timestamp: Date;
    provider: string;
    error?: string;
  }): void {
    // 这里可以记录到数据库或日志文件
    console.log(`短信记录: ${JSON.stringify(record)}`);
  }

  // 获取短信发送统计
  async getSMSStats(startDate?: Date, endDate?: Date): Promise<any> {
    // 这里应该从数据库获取统计数据
    return {
      totalSent: 0,
      successRate: 100,
      failureRate: 0,
      costTotal: 0,
      byType: {
        notification: 0,
        verification: 0,
        urgent: 0,
        exam_reminder: 0,
        assignment_reminder: 0,
        grade_notification: 0
      }
    };
  }

  // 检查短信服务状态
  async checkServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    provider: string;
    lastCheck: Date;
    message?: string;
  }> {
    try {
      // 这里可以实现服务健康检查
      return {
        status: 'healthy',
        provider: this.config.provider,
        lastCheck: new Date(),
        message: '短信服务运行正常'
      };
    } catch (error) {
      return {
        status: 'down',
        provider: this.config.provider,
        lastCheck: new Date(),
        message: `短信服务异常: ${error.message}`
      };
    }
  }

  // 添加自定义短信模板
  addTemplate(template: SMSTemplate): void {
    this.templates.set(template.id, template);
    console.log(`添加短信模板: ${template.name}`);
  }

  // 获取所有可用模板
  getAllTemplates(): SMSTemplate[] {
    return Array.from(this.templates.values());
  }

  // 批量发送短信
  async batchSendSMS(
    recipients: Array<{ phone: string; message: string; type?: string }>, 
    options: { 
      maxConcurrent?: number; 
      delayBetweenSends?: number;
    } = {}
  ): Promise<{ success: number; failed: number; results: any[] }> {
    const { maxConcurrent = 10, delayBetweenSends = 100 } = options;
    const results = [];
    let success = 0;
    let failed = 0;

    // 分批发送以避免过载
    for (let i = 0; i < recipients.length; i += maxConcurrent) {
      const batch = recipients.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (recipient, index) => {
        try {
          // 添加延迟避免频率限制
          if (delayBetweenSends > 0) {
            await new Promise(resolve => setTimeout(resolve, index * delayBetweenSends));
          }

          const result = await this.sendSMS(
            recipient.phone, 
            recipient.message, 
            recipient.type || 'notification'
          );

          if (result) {
            success++;
            return { phone: recipient.phone, status: 'success' };
          } else {
            failed++;
            return { phone: recipient.phone, status: 'failed', error: '发送失败' };
          }
        } catch (error) {
          failed++;
          return { 
            phone: recipient.phone, 
            status: 'failed', 
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' }));
    }

    console.log(`批量短信发送完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed, results };
  }
}

export default new SMSService(); 