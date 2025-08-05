import axios, { AxiosInstance } from 'axios';

interface QwenMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface QwenRequest {
  model: string;
  messages: QwenMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stream?: boolean;
}

interface QwenChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface QwenResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: QwenChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class QwenAIService {
  private client: AxiosInstance;
  private model: string;

  constructor() {
    const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-d2947ef5716c46148da195ccd17d440f';
    const apiUrl = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.model = process.env.DASHSCOPE_MODEL || 'qwen3-235b-a22b-instruct-2507';

    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY 环境变量未设置');
    }

    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    });
  }

  /**
   * 调用千问模型生成文本
   */
  async generateText(
    messages: QwenMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    } = {}
  ): Promise<string> {
    console.log('调用AI生成文本，选项:', options);
    try {
      const request: QwenRequest = {
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        top_p: options.topP || 0.9,
        stream: false
      };

      if (options.topK) {
        (request as any).top_k = options.topK;
      }

      const response = await this.client.post<QwenResponse>('/chat/completions', request);
      
      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error('AI模型未返回有效响应');
      }

      const content = response.data.choices[0].message.content;
      if (!content) {
        throw new Error('AI模型返回内容为空');
      }

      return content.trim();
    } catch (error) {
      console.error('AI生成文本失败:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('AI服务请求超时，请重试');
        }
        const errorMessage = error.response?.data?.error?.message || error.message;
        console.error('千问API错误响应:', error.response?.data);
        throw new Error(`千问模型调用失败: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * 生成体育题目
   */
  async generateSportsQuestion(params: {
    sport: string;
    knowledgePoint: string;
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'single_choice' | 'multiple_choice' | 'true_false' | 'case_analysis' | 'fill_blank';
    context?: string;
  }) {
    console.log('开始生成AI题目，参数:', params);
    const difficultyMap = {
      easy: '简单',
      medium: '中等',  
      hard: '困难'
    };

    const typeMap = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      true_false: '判断题',
      case_analysis: '案例分析题',
      fill_blank: '填空题'
    };

    const prompt = `
你是一位专业的体育教育专家，请根据以下要求生成一道体育知识题目：

**题目要求：**
- 运动项目：${params.sport}
- 知识点：${params.knowledgePoint}
- 难度等级：${difficultyMap[params.difficulty]}
- 题目类型：${typeMap[params.type]}
${params.context ? `- 背景信息：${params.context}` : ''}

**输出格式要求：**
请严格按照以下JSON格式输出，不要包含任何其他文字说明：

\`\`\`json
{
  "title": "题目标题（简洁明了）",
  "content": "题目内容（详细描述题目情境和问题）",
  "options": [
    {"text": "选项A的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
    {"text": "选项B的内容", "isCorrect": true, "explanation": "此选项的解释说明"},
    {"text": "选项C的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
    {"text": "选项D的内容", "isCorrect": false, "explanation": "此选项的解释说明"}
  ],
  "explanation": "详细的题目解析，包括正确答案的原理和其他选项错误的原因",
  "tags": ["相关标签1", "相关标签2", "相关标签3"]
}
\`\`\`

**质量要求：**
1. 题目内容必须准确、专业，符合体育专业知识
2. 选项设置合理，干扰项要有一定迷惑性但不能误导学习
3. 解析要详细清楚，有助于学生理解和学习
4. 严格符合指定的难度等级
5. 标签要准确反映题目涉及的知识点

请开始生成题目：
    `;

    const messages: QwenMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.generateText(messages, {
        temperature: 0.7,
        maxTokens: 2000
      });
      
      console.log('收到AI响应，长度:', response.length);
      console.log('AI响应前100字符:', response.substring(0, 100));

      // 解析JSON响应
      try {
        // 提取JSON内容（去除可能的markdown代码块标记）
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonContent = jsonMatch ? jsonMatch[1] : response;
        
        const cleanContent = jsonContent
          .replace(/```json\n?|\n?```/g, '')
          .trim();
        
        const questionData = JSON.parse(cleanContent);
        
        // 验证数据结构
        if (!questionData.title || !questionData.content || !questionData.options || !questionData.explanation) {
          throw new Error('AI返回的题目数据结构不完整');
        }

        if (!Array.isArray(questionData.options) || questionData.options.length === 0) {
          throw new Error('题目选项数据无效');
        }

        // 确保至少有一个正确答案
        const hasCorrectAnswer = questionData.options.some((option: any) => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          throw new Error('题目必须包含至少一个正确答案');
        }

        console.log('AI题目生成成功，标题:', questionData.title);
        return questionData;
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError);
        console.error('原始响应:', response);
        throw new Error('AI返回的数据格式不正确，请重试');
      }
    } catch (aiError) {
      console.error('AI生成题目失败:', aiError);
      throw aiError;
    }
  }

  /**
   * 高效批量生成题目（单次请求）
   */
  async generateMultipleQuestionsBatch(
    params: {
      sport: string;
      knowledgePoint: string;
      difficulty: 'easy' | 'medium' | 'hard';
      type: 'single_choice' | 'multiple_choice' | 'true_false' | 'case_analysis' | 'fill_blank';
      context?: string;
    },
    count: number = 5
  ) {
    console.log(`开始批量生成AI题目，参数:`, params, `数量: ${count}`);
    
    const difficultyMap = {
      easy: '简单',
      medium: '中等',  
      hard: '困难'
    };

    const typeMap = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      true_false: '判断题',
      case_analysis: '案例分析题',
      fill_blank: '填空题'
    };

    const prompt = `
你是一位专业的体育教育专家，请根据以下要求一次性生成${count}道体育知识题目：

**题目要求：**
- 运动项目：${params.sport}
- 知识点：${params.knowledgePoint}
- 难度等级：${difficultyMap[params.difficulty]}
- 题目类型：${typeMap[params.type]}
- 题目数量：${count}道
${params.context ? `- 背景信息：${params.context}` : ''}

**输出格式要求：**
请严格按照以下JSON数组格式输出${count}道题目，不要包含任何其他文字说明：

\`\`\`json
[
  {
    "title": "第1题标题（简洁明了）",
    "content": "第1题内容（详细描述题目情境和问题）",
    "options": [
      {"text": "选项A的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
      {"text": "选项B的内容", "isCorrect": true, "explanation": "此选项的解释说明"},
      {"text": "选项C的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
      {"text": "选项D的内容", "isCorrect": false, "explanation": "此选项的解释说明"}
    ],
    "explanation": "第1题的详细解析，包括正确答案的原理和其他选项错误的原因",
    "tags": ["相关标签1", "相关标签2", "相关标签3"]
  },
  {
    "title": "第2题标题（简洁明了）",
    "content": "第2题内容（详细描述题目情境和问题）",
    "options": [
      {"text": "选项A的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
      {"text": "选项B的内容", "isCorrect": true, "explanation": "此选项的解释说明"},
      {"text": "选项C的内容", "isCorrect": false, "explanation": "此选项的解释说明"},
      {"text": "选项D的内容", "isCorrect": false, "explanation": "此选项的解释说明"}
    ],
    "explanation": "第2题的详细解析，包括正确答案的原理和其他选项错误的原因",
    "tags": ["相关标签1", "相关标签2", "相关标签3"]
  }
]
\`\`\`

**质量要求：**
1. 每道题目内容必须准确、专业，符合体育专业知识
2. 题目之间要有差异性，不能重复或过于相似
3. 选项设置合理，干扰项要有一定迷惑性但不能误导学习
4. 解析要详细清楚，有助于学生理解和学习
5. 严格符合指定的难度等级
6. 标签要准确反映题目涉及的知识点
7. 确保每道题目都有明确的正确答案

请开始生成${count}道题目：
    `;

    const messages: QwenMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      // 根据题目数量和类型动态调整token数
      let maxTokens = 2000; // 基础token数
      
      if (count <= 3) {
        maxTokens = Math.max(3000, count * 1000); // 小批量：更多token保证质量
      } else if (count <= 10) {
        maxTokens = Math.max(4000, count * 600);  // 中批量：平衡质量和数量
      } else {
        maxTokens = Math.max(6000, count * 400);  // 大批量：优化效率
      }
      
      console.log(`为${count}道题目分配${maxTokens} tokens`);
      
      const response = await this.generateText(messages, {
        temperature: 0.7,
        maxTokens
      });
      
      console.log('收到AI批量响应，长度:', response.length);
      console.log('AI响应前200字符:', response.substring(0, 200));

      // 解析JSON数组响应
      try {
        // 提取JSON内容（去除可能的markdown代码块标记）
        let jsonContent = response;
        
        // 尝试多种JSON提取方式
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        } else {
          // 尝试提取数组部分
          const arrayMatch = response.match(/\[([\s\S]*)\]/);
          if (arrayMatch) {
            jsonContent = `[${arrayMatch[1]}]`;
          }
        }
        
        const cleanContent = jsonContent
          .replace(/```json\n?|\n?```/g, '')
          .replace(/^[^[\{]*/, '') // 去除JSON前的无关内容
          .replace(/[^}\]]*$/, '') // 去除JSON后的无关内容
          .trim();
        
        console.log('清理后的JSON内容:', cleanContent.substring(0, 500));
        
        const questionsData = JSON.parse(cleanContent);
        
        // 验证数据结构
        if (!Array.isArray(questionsData)) {
          throw new Error('AI返回的数据不是数组格式');
        }

                 const validQuestions: any[] = [];
         const errors: { index: number; error: string }[] = [];

        // 验证每个题目
        questionsData.forEach((questionData, index) => {
          try {
            // 更宽松的验证，允许部分字段缺失
            if (!questionData.title && !questionData.content) {
              throw new Error(`第${index + 1}题标题和内容均缺失`);
            }

            // 如果没有标题，使用内容的前50个字符作为标题
            if (!questionData.title) {
              questionData.title = questionData.content.substring(0, 50) + '...';
            }

            // 如果没有内容，使用标题作为内容
            if (!questionData.content) {
              questionData.content = questionData.title;
            }

            // 验证选项
            if (!questionData.options || !Array.isArray(questionData.options)) {
              throw new Error(`第${index + 1}题选项数据无效`);
            }

            if (questionData.options.length === 0) {
              throw new Error(`第${index + 1}题选项为空`);
            }

            // 确保至少有一个正确答案
            const hasCorrectAnswer = questionData.options.some((option: any) => 
              option.isCorrect === true || option.isCorrect === 'true'
            );
            if (!hasCorrectAnswer) {
              // 如果没有正确答案，默认第一个选项为正确答案
              console.warn(`第${index + 1}题缺少正确答案，默认设置第一个选项为正确答案`);
              questionData.options[0].isCorrect = true;
            }

            // 如果没有解析，生成默认解析
            if (!questionData.explanation) {
              questionData.explanation = '暂无详细解析';
            }

            // 如果没有标签，生成默认标签
            if (!questionData.tags || !Array.isArray(questionData.tags)) {
              questionData.tags = ['AI生成题目'];
            }

            validQuestions.push(questionData);
            console.log(`第${index + 1}题生成成功，标题:`, questionData.title);
          } catch (validationError) {
            console.error(`第${index + 1}题验证失败:`, validationError);
            console.error(`问题数据:`, JSON.stringify(questionData, null, 2));
            errors.push({
              index: index + 1,
              error: validationError instanceof Error ? validationError.message : '未知验证错误'
            });
          }
        });

        console.log(`批量生成完成，成功: ${validQuestions.length}/${count}，失败: ${errors.length}`);
        return { questions: validQuestions, errors };

      } catch (parseError) {
        console.error('解析AI批量响应失败:', parseError);
        console.error('原始响应长度:', response.length);
        console.error('原始响应前500字符:', response.substring(0, 500));
        console.error('原始响应后500字符:', response.substring(Math.max(0, response.length - 500)));
        
        // 尝试手动修复常见的JSON格式问题
        try {
          console.log('尝试手动修复JSON格式...');
          let fixedResponse = response
            .replace(/```json\s*/gi, '')
            .replace(/\s*```/g, '')
            .replace(/,\s*]/g, ']')      // 修复尾部多余的逗号
            .replace(/,\s*}/g, '}')      // 修复对象尾部多余的逗号
            .replace(/\}\s*\{/g, '},{')  // 修复对象间缺少逗号
            .replace(/\]\s*\[/g, '],['); // 修复数组间缺少逗号
          
          // 尝试找到完整的JSON数组
          const arrayStart = fixedResponse.indexOf('[');
          const arrayEnd = fixedResponse.lastIndexOf(']');
          
          if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
            const arrayContent = fixedResponse.substring(arrayStart, arrayEnd + 1);
            console.log('尝试解析修复后的JSON:', arrayContent.substring(0, 200));
            
            const fixedData = JSON.parse(arrayContent);
            if (Array.isArray(fixedData) && fixedData.length > 0) {
              console.log('JSON修复成功，继续处理...');
              
              // 重新处理修复后的数据
              const validQuestions: any[] = [];
              const errors: { index: number; error: string }[] = [];
              
              fixedData.forEach((questionData, index) => {
                try {
                  // 这里可以复用上面的验证逻辑
                  if (typeof questionData === 'object' && questionData !== null) {
                    // 基本清理和验证
                    if (!questionData.title && !questionData.content) {
                      throw new Error(`第${index + 1}题数据不完整`);
                    }
                    
                    validQuestions.push(questionData);
                  }
                } catch (fixError) {
                  errors.push({
                    index: index + 1,
                    error: fixError instanceof Error ? fixError.message : '修复验证失败'
                  });
                }
              });
              
              if (validQuestions.length > 0) {
                console.log(`JSON修复后成功救回 ${validQuestions.length} 道题目`);
                return { questions: validQuestions, errors };
              }
            }
          }
        } catch (fixError) {
          console.error('JSON修复失败:', fixError);
        }
        
        throw new Error(`AI返回的数据格式不正确: ${parseError instanceof Error ? parseError.message : '未知解析错误'}`);
      }
    } catch (aiError) {
      console.error('AI批量生成题目失败:', aiError);
      throw aiError;
    }
  }

  /**
   * 批量生成题目（兼容旧版本，使用循环方式作为后备）
   */
  async generateMultipleQuestions(
    params: {
      sport: string;
      knowledgePoint: string;
      difficulty: 'easy' | 'medium' | 'hard';
      type: 'single_choice' | 'multiple_choice' | 'true_false' | 'case_analysis' | 'fill_blank';
      context?: string;
    },
    count: number = 5
  ) {
    // 优先尝试高效批量生成
    try {
      console.log('尝试使用高效批量生成模式');
      const result = await this.generateMultipleQuestionsBatch(params, count);
      
      // 如果成功率太低，回退到循环模式
      const successRate = result.questions.length / count;
      if (successRate < 0.4) { // 成功率低于40%才回退
        console.log(`批量生成成功率过低 (${result.questions.length}/${count}, ${(successRate * 100).toFixed(1)}%)，回退到循环模式`);
        throw new Error('批量生成成功率过低，使用循环模式');
      }
      
      // 如果有部分成功，记录统计信息
      if (result.errors.length > 0) {
        console.log(`批量生成部分成功 (${result.questions.length}/${count})，错误信息:`, result.errors);
      }
      
      return result;
    } catch (batchError: any) {
      console.log('批量生成失败，回退到循环模式:', batchError.message);
      
      // 回退到原来的循环方式
      const questions = [];
      const errors = [];

      for (let i = 0; i < count; i++) {
        try {
          const question = await this.generateSportsQuestion(params);
          questions.push(question);
          
          // 减少延时从1秒到500ms
          if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          errors.push({
            index: i + 1,
            error: error instanceof Error ? error.message : '未知错误'
          });
        }
      }

      return { questions, errors };
    }
  }

  /**
   * 优化题目内容
   */
  async optimizeQuestion(questionContent: string, requirements: string) {
    const prompt = `
请优化以下体育题目，使其更符合教学要求：

**原题目内容：**
${questionContent}

**优化要求：**
${requirements}

**请输出优化后的完整题目内容，保持JSON格式。**
    `;

    const messages: QwenMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.generateText(messages, {
      temperature: 0.3,
      maxTokens: 1500
    });
  }
}

// 导出单例实例
export const qwenAIService = new QwenAIService();
export default qwenAIService; 